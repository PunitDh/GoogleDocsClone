const { Schema, model } = require("mongoose");

const Document = new Schema(
  {
    _id: String,
    title: { type: String, required: true },
    data: Object,
    visible: { type: Boolean, required: true, default: true },
    userId: { type: String, required: true },
    public: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = model("Document", Document);
