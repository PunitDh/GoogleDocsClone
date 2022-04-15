const { Schema, model } = require("mongoose");

const Document = new Schema(
  {
    _id: String,
    title: String,
    data: Object,
  },
  { timestamps: true }
);

module.exports = model("Document", Document);
