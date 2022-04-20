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
}

module.exports = new DocumentDAO();
