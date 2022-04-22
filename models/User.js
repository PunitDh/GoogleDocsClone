const { Schema, model } = require("mongoose");

const User = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    superUser: {
      type: Boolean,
      required: true,
      default: false,
    },
    confirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    confirmationToken: {
      type: String,
      required: false,
    },
    resetPasswordToken: {
      type: String,
      required: false,
      expires: "1h",
    },
    resetPasswordWebToken: {
      type: String,
      required: false,
      expires: "1h",
    },
    picture: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = model("User", User);
