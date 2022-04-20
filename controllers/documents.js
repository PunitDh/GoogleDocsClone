const { verifyJWT } = require("../auth");
const Document = require("../models/Document");
const User = require("../models/User");
const userDAO = require("../dao/UserDAO");
const documentDAO = require("../dao/DocumentDAO");

class DocumentsController {
  constructor(io, socket) {
    this.socket = socket;
    this.io = io;
  }

  async getDocuments(token) {
    const decodedUser = verifyJWT(token);
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

    this.socket.on("save-document", async (data, title) => {
      console.log("Saving Document", { userId, documentId });
      const save = await Document.findByIdAndUpdate(documentId, {
        data,
        title,
      });
      console.log("Document saved", save);
      this.socket.emit("document-saved", "Document saved");
    });

    this.socket.on("set-title", async (title) => {
      const save = await Document.findByIdAndUpdate(documentId, { title });
      console.log("Title saved", save);
    });

    this.socket.on("change-privacy", async (publicDocument) => {
      const save = await Document.findByIdAndUpdate(documentId, {
        public: publicDocument,
      });
      console.log("Privacy changed", save);
    });
  }

  async deleteDocument(document, userId) {
    console.log("Deleting document");
    const user = await User.findById(userId);

    if (user?.superUser || user?._id === document.userId) {
      const deleted = await Document.findByIdAndDelete(document);
      console.log("Document deleted", deleted);
      return { success: true, message: "Document deleted", document };
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
  const defaultValue = "";

  if (documentId == null) return;
  const document = await documentDAO.getDocument(documentId);
  const user = await userDAO.getUser(userId);

  if (document) {
    if (document.userId === userId || user.superUser || document.public) {
      return document;
    }
  } else {
    return await Document.create({
      _id: documentId,
      data: defaultValue,
      title,
      userId,
      author: `${user.firstName} ${user.lastName}`,
      public: Boolean(publicDocument),
    });
  }
}

module.exports = DocumentsController;
