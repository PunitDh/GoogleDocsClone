const userDAO = require("../dao/UserDAO");
const documentDAO = require("../dao/DocumentDAO");
const authService = require("../service/auth");

class DocumentsController {
  constructor(io, socket) {
    this.socket = socket;
    this.io = io;
  }

  async getDocuments(token) {
    const decodedUser = authService.verifyToken(token);
    if (decodedUser) {
      const user = await userDAO.getUser(decodedUser.id);
      if (!user) return;
      return user.superUser
        ? await documentDAO.getDocuments()
        : await documentDAO.getDocumentsByUserId(user._id);
    } else {
      console.log("Failed to verify token");
      return false;
    }
  }

  async getDocument(documentId, title, publicDocument, userId) {
    const document = await findOrCreateDocument(
      documentId,
      title,
      publicDocument,
      userId
    );
    this.socket.join(documentId);
    this.socket.emit("load-document", document);

    this.socket.on("send-changes", (delta) => {
      console.log(delta);
      this.socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    this.socket.on("save-document", async (data, title, intervalSave) => {
      console.log("Saving Document", { userId, documentId });
      const save = await documentDAO.updateDocument(documentId, {
        data,
        title,
      });
      console.log("Document saved", save);
      this.socket.emit("document-saved", "Document saved", intervalSave);
    });

    this.socket.on("set-title", async (title) => {
      const save = await documentDAO.updateDocument(documentId, { title });
      console.log("Title saved", save);
    });

    this.socket.on("change-privacy", async (publicDocument) => {
      const save = await documentDAO.updateDocument(documentId, {
        public: publicDocument,
      });
      console.log("Privacy changed", save);
    });
  }

  async deleteDocument(documentId, userId, token) {
    console.log("Deleting document");
    const user = await userDAO.getUser(userId);
    const decoded = authService.verifyToken(token);

    if (
      user?.superUser ||
      (user?._id === documentId.userId && decoded?.id === userId)
    ) {
      const deleted = await documentDAO.deleteDocument(documentId);
      console.log("Document deleted", deleted);
      return {
        success: true,
        message: "Document deleted",
        documentId,
      };
    } else {
      console.log("User is not authorized to delete this document");
      return {
        success: false,
        message: "User is not authorized to delete this document",
      };
    }
  }
}

async function findOrCreateDocument(documentId, title, publicDocument, userId) {
  if (documentId == null) return;
  const document = await documentDAO.getDocument(documentId);
  const user = await userDAO.getUser(userId);

  if (document) {
    if (document.userId === userId || user.superUser || document.public) {
      return document;
    }
  } else {
    return await documentDAO.createDocument(
      documentId,
      user,
      title,
      publicDocument
    );
  }
}

module.exports = DocumentsController;
