const { Schema, model } = require("mongoose");

const User = new Schema(
  {
    email: String,
    password: String,
    firstName: String,
    lastName: String,
  },
  { timestamps: true }
);

module.exports = model("User", User);
