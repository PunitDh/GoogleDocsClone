const Document = require("../models/Document");

class DocumentDAO {
  async getDocument(documentId) {
    return await Document.findById(documentId);
  }

  async getDocuments() {
    return await Document.find().sort({ updatedAt: -1 });
  }

  async getDocumentsByUserId(userId) {
    const documents = await this.getDocumentsByParams({
      userId,
      public: false,
    });

    const publicDocuments = await this.getDocumentsByParams({
      public: true,
    });

    documents.push(...publicDocuments).sort({
      updatedAt: -1,
    });

    return documents;
  }

  async getDocumentsByParams(params) {
    return await Document.find(params);
  }

  async createDocument(documentId, user, title, publicDocument) {
    const defaultValue = "";

    return await Document.create({
      _id: documentId,
      data: defaultValue,
      title,
      userId: user._id,
      author: `${user.firstName} ${user.lastName}`,
      public: Boolean(publicDocument),
    });
  }

  async updateDocument(documentId, data) {
    return await Document.findByIdAndUpdate(documentId, data);
  }

  async deleteDocument(documentId) {
    return await Document.findByIdAndDelete(documentId);
  }

  async deleteDocumentsByUserId(userId) {
    return await Document.deleteMany({ userId });
  }
}

module.exports = new DocumentDAO();
