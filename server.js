require("dotenv").config();
const isProduction = process.env.NODE_ENV === "production";
const path = require("path");
const mongoose = require("mongoose");
const Document = require("./models/Document");
const User = require("./models/User");
const express = require("express");
const app = isProduction && express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const http = isProduction && require("http").Server(app);
const { authenticateUser, verifyJWT, generateJWT } = require("./auth");
const {
  sendConfirmationEmail,
  confirmUserAccount,
  sendForgotPasswordEmail,
} = require("./mailer");
const port = process.env.PORT || 3010;
let io;

console.log({ isProduction });
console.log("Server starting...");

if (isProduction) {
  app.use(cors());
  app.use(express.static(__dirname));
  app.use(express.static(path.join(__dirname, "client", "build")));
  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });
  io = require("socket.io")(http);
  console.log("Web socket server started in production");
} else {
  io = require("socket.io")(process.env.PORT || 3001, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });
  console.log("Web socket server started locally");
}

mongoose
  .connect(process.env.MONGODB_URL)
  .then((res) => {
    console.log("Connected to MongoDB database:", res.connections[0].name);
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB database", err);
  });

const defaultValue = "";

function verifyToken(token, callback, error) {
  try {
    const decoded = verifyJWT(token);
    if (decoded) {
      callback(decoded);
    } else {
      error();
    }
  } catch (err) {
    error();
  }
}

io.on("connection", (socket) => {
  console.log("Web socket connected to socketID:", socket.id);

  socket.on("get-documents", async (token) => {
    const decodedUser = verifyJWT(token);
    if (decodedUser) {
      const user = await User.findById(decodedUser.id);
      if (!user) return;
      if (user.superUser) {
        const documents = await Document.find().sort({ updatedAt: -1 });
        socket.emit("load-documents", documents);
      } else {
        const documents = await Document.find({
          userId: user._id,
          public: false,
        });

        const publicDocuments = await Document.find({
          public: true,
        });

        documents.push(...publicDocuments).sort({
          updatedAt: -1,
        });

        socket.emit("load-documents", documents);
      }
    } else {
      console.log("Failed to verify token");
      io.to(socket.id).emit("invalid-token");
    }
  });

  socket.on("get-document", async (documentId, title, public, userId) => {
    const document = await findOrCreateDocument(
      documentId,
      title,
      public,
      userId
    );
    socket.join(documentId);
    socket.emit("load-document", document);

    socket.on("send-changes", (delta) => {
      console.log(delta);
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data, title) => {
      console.log("Saving Document", { userId, documentId });
      const save = await Document.findByIdAndUpdate(documentId, {
        data,
        title,
      });
      console.log("Document saved", save);
      socket.emit("document-saved", "Document saved");
    });

    socket.on("set-title", async (title) => {
      const save = await Document.findByIdAndUpdate(documentId, { title });
      console.log("Title saved", save);
    });

    socket.on("change-privacy", async (public) => {
      const save = await Document.findByIdAndUpdate(documentId, { public });
      console.log("Privacy changed", save);
    });
  });

  socket.on("verify-token", async (token) => {
    const decoded = verifyJWT(token);
    if (decoded) {
      const userData = await User.findById(decoded.id);
      const { user } = authenticateUser(userData);
      if (userData) {
        io.to(socket.id).emit("verified-token", user);
      }
    } else {
      console.log("Failed to verify token");
      io.to(socket.id).emit("invalid-token");
    }
  });

  socket.on("confirm-email", async (token) => {
    const confirmedUser = await confirmUserAccount(token);
    if (confirmedUser) {
      const { jwt } = authenticateUser(confirmedUser);
      io.to(socket.id).emit("confirm-email-success", jwt);
    } else {
      console.log("Failed to confirm email");
    }
  });

  socket.on("change-password", async (passwordObj, token) => {
    const decoded = verifyJWT(token);
    if (decoded) {
      const user = await User.findById(decoded.id);
      if (user) {
        if (bcrypt.compareSync(passwordObj.oldPassword, user.password)) {
          try {
            user.password = passwordObj.newPassword;
            await user.save();
            console.log("Password changed successfully");
            io.to(socket.id).emit(
              "change-password-success",
              "Password changed successfully"
            );
          } catch (err) {
            console.log("Failed to save user");
            io.to(socket.id).emit(
              "change-password-failure",
              "Failed to update password"
            );
          }
        } else {
          console.log("Wrong password");
          io.to(socket.id).emit("change-password-failure", "Wrong password");
        }
      }
    } else {
      console.log("Failed to verify token");
      io.to(socket.id).emit("change-password-failure", "User is invalid");
    }
  });

  socket.on("register-user", async (user) => {
    const newUser = await User.findOne({ email: user.email });
    if (newUser) {
      console.log("Email already exists");
      io.to(socket.id).emit(
        "user-registered-failure",
        "E-mail address already in use"
      );
    } else {
      const newUser = new User({
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      try {
        const userData = await newUser.save();

        console.log("Email address registered successfully");
        const { jwt } = authenticateUser(userData);

        await sendConfirmationEmail(userData);
        console.log("Confirmation email sent");
        io.to(socket.id).emit(
          "user-registered-success",
          jwt,
          "Email address registered successfully"
        );
      } catch (err) {
        console.log("Failed to save user", err);
        io.to(socket.id).emit(
          "user-registered-failure",
          "Failed to register user"
        );
      }
    }
  });

  socket.on("login-user", async (user) => {
    const userData = await User.findOne({ email: user.email });
    if (userData) {
      if (bcrypt.compareSync(user.password, userData.password)) {
        console.log("Login successful");
        const { jwt } = authenticateUser(userData);
        io.to(socket.id).emit("login-success", jwt, "Login successful");
      } else {
        console.log("Wrong password");
        io.to(socket.id).emit("login-failure", "Wrong password");
      }
    } else {
      console.log("User not found");
      io.to(socket.id).emit("login-failure", "User not found");
    }
  });

  socket.on("update-account", async (currentUser, token) => {
    const decoded = verifyJWT(token);
    if (decoded) {
      const userData = await User.findById(currentUser.id);
      if (userData) {
        userData.firstName = currentUser.firstName;
        userData.lastName = currentUser.lastName;
        userData.email = currentUser.email;
      }
      try {
        await userData.save();
        io.to(socket.id).emit("update-account-success");
      } catch (err) {
        console.log("Failed to update account", err);
        io.to(socket.id).emit(
          "update-account-failure",
          "Failed to update account"
        );
      }
    } else {
      console.log("Failed to verify token");
      io.to(socket.id).emit("update-account-failure", "User is invalid");
    }
  });

  socket.on("forgot-password", async (email) => {
    console.log("Forgot password", email);
    const userData = await User.findOne({ email });
    if (userData) {
      console.log("User found");
      try {
        await sendForgotPasswordEmail(userData);
        io.to(socket.id).emit(
          "forgot-password-success",
          "Please check your email for a confirmation code"
        );
      } catch (err) {
        console.log("Failed to send email", err);
        io.to(socket.id).emit(
          "forgot-password-failure",
          "Failed to send email"
        );
      }
    } else {
      console.log("User not found");
      io.to(socket.id).emit("forgot-password-failure", "User not found");
    }
  });

  socket.on("verify-forgot-password-code", async (email, code) => {
    console.log("Verifying forgot password code", email, code);
    const userData = await User.findOne({ email });
    if (userData) {
      console.log("User found");

      if (bcrypt.compareSync(code, userData.resetPasswordToken)) {
        console.log("Code verified");
        userData.resetPasswordToken = null;
        userData.resetPasswordWebToken = uuid();
        const token = generateJWT(
          { id: userData._id, uuid: userData.resetPasswordWebToken },
          "1h"
        );

        try {
          await userData.save();
          io.to(socket.id).emit(
            "verify-forgot-password-code-success",
            "Code verified",
            token
          );
        } catch (err) {
          console.log("Failed to save user", err);
          io.to(socket.id).emit(
            "verify-forgot-password-code-failure",
            "Password reset failed"
          );
        }
      } else {
        console.log("Invalid code entered");
        io.to(socket.id).emit(
          "verify-forgot-password-code-failure",
          "Invalid code entered"
        );
      }
    } else {
      console.log("User not found");
      io.to(socket.id).emit(
        "verify-forgot-password-code-failure",
        "User is invalid"
      );
    }
  });

  socket.on("verify-reset-password-code", (token) => {
    const decoded = verifyJWT(`t ${token}`);
    if (!decoded) {
      console.log("Invalid code");
      io.to(socket.id).emit(
        "verify-reset-password-code-failure",
        "Invalid code"
      );
    }
  });

  socket.on("reset-password", async (password, token) => {
    const decoded = verifyJWT(`t ${token}`);
    if (decoded) {
      const userData = await User.findById(decoded.id);
      if (userData && userData.resetPasswordWebToken === decoded.uuid) {
        userData.password = password;
        userData.resetPasswordWebToken = null;
        try {
          await userData.save();
          const { jwt } = authenticateUser(userData);
          io.to(socket.id).emit(
            "reset-password-success",
            "Password changed successfully",
            jwt
          );
          console.log("Password changed successfully");
        } catch (err) {
          console.log("Failed to reset password", err);
          io.to(socket.id).emit(
            "reset-password-failure",
            "Failed to reset password"
          );
        }
      } else {
        console.log("Authentication error: Invalid token");
        io.to(socket.id).emit(
          "reset-password-failure",
          "Authentication error: Invalid token"
        );
      }
    }
  });

  socket.on("delete-document", async (documentId, userId) => {
    const user = await User.findById(userId);

    if (user?.superUser || user?._id === documentId.userId) {
      const deleted = await Document.findByIdAndDelete(documentId);
      console.log("Document deleted", deleted);
      io.to(socket.id).emit("document-deleted", documentId);
    } else {
      console.log("User is not authorized to delete this document");
      io.to(socket.id).emit(
        "unauthorized-document-delete",
        "User is not authorized to delete this document"
      );
    }
  });

  socket.on("delete-permanently", async (token) => {
    const decoded = verifyJWT(token);
    if (decoded) {
      const userId = decoded.id;
      try {
        await Document.deleteMany({ userId });
        await User.findByIdAndDelete(userId);
        io.emit("user-deleted", "Account deleted successfully");
      } catch (err) {
        console.log("Failed to delete user");
        io.to(socket.id).emit("delete-permanently-failure", "Failed to delete");
      }
      console.log("Failed to verify token");
      io.to(socket.id).emit("delete-permanently-failure", "User is invalid");
    }
  });
});

async function findOrCreateDocument(documentId, title, public, userId) {
  if (documentId == null) return;
  const document = await Document.findById(documentId);
  const user = await User.findById(userId);

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
      public: Boolean(public),
    });
  }
}

isProduction &&
  http.listen(port, () => console.log("Server started on port", port));
