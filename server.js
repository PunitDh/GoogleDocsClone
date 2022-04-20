require("dotenv").config();
const isProduction = process.env.NODE_ENV === "production";
const path = require("path");
const mongoose = require("mongoose");
const express = require("express");
const app = isProduction && express();
const cors = require("cors");
const http = isProduction && require("http").Server(app);
const port = process.env.PORT || 3010;
let io;
const DocumentsController = require("./controllers/documents.js");
const authController = require("./controllers/auth.js");
const usersController = require("./controllers/users.js");

console.log({ isProduction });
console.log("Server starting...");

if (isProduction) {
  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    })
  );

  app.use(express.static(path.join(__dirname, "../client/build")));
  app.enable("trust proxy");
  console.log("Enabling proxy");
  const secureRedirect = (res) => {
    console.log("Insecure connection found. Redirecting to secure connection.");
    res.redirect("https://" + req.headers.host + req.url);
  };
  app.use((req, res, next) => {
    req.secure ? next() : secureRedirect(res);
  });
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

io.on("connection", (socket) => {
  console.log("New socket connection with socketID:", socket.id);

  const documentsController = new DocumentsController(io, socket);

  const emitToSocket = (message, ...args) =>
    io.to(socket.id).emit(message, ...args);

  socket.on("get-documents", async (token) => {
    const documents = await documentsController.getDocuments(token);
    if (documents) {
      return socket.emit("load-documents", documents);
    }
    return emitToSocket("invalid-token");
  });

  socket.on("get-document", async (documentId, title, public, userId) => {
    return await documentsController.getDocument(
      documentId,
      title,
      public,
      userId
    );
  });

  socket.on("verify-token", async (token) => {
    const user = await authController.verifyToken(token);
    if (user) {
      return emitToSocket("verified-token", user);
    }
    return emitToSocket("invalid-token");
  });

  socket.on("confirm-email", async (token) => {
    const user = await authController.confirmUserAccount(token);
    if (user) {
      return emitToSocket("confirm-email-success", jwt);
    }
    return emitToSocket("confirm-email-failure");
  });

  socket.on("change-password", async (passwordObj, token) => {
    const passwordChange = await authController.changePassword(
      passwordObj,
      token
    );
    if (passwordChange.success) {
      return emitToSocket("change-password-success", passwordChange.message);
    }
    return emitToSocket("change-password-failure", passwordChange.message);
  });

  socket.on("register-user", async (user) => {
    const registration = await authController.registerUser(user);
    if (registration.success) {
      return emitToSocket(
        "register-user-success",
        registration.jwt,
        registration.message
      );
    }
    return emitToSocket("user-registered-failure", registration.message);
  });

  socket.on("login-user", async (user) => {
    const login = await authController.loginUser(user);
    if (login.success) {
      return emitToSocket("login-success", login.jwt, login.message);
    }
    return emitToSocket("login-failure", login.message);
  });

  socket.on("update-account", async (currentUser, token) => {
    const updateAccount = await authController.updateAccount(
      currentUser,
      token
    );
    if (updateAccount.success) {
      return emitToSocket("update-account-success", updateAccount.message);
    }
    return emitToSocket("update-account-failure", updateAccount.message);
  });

  socket.on("forgot-password", async (email) => {
    const forgotPassword = await authController.forgotPassword(email);
    if (forgotPassword.success) {
      return emitToSocket("forgot-password-success", forgotPassword.message);
    }
    return emitToSocket("forgot-password-failure", forgotPassword.message);
  });

  socket.on("verify-forgot-password-code", async (email, code) => {
    const verifyCode = await authController.verifyForgotPasswordCode(
      email,
      code
    );
    if (verifyCode.success) {
      return emitToSocket(
        "verify-forgot-password-code-success",
        verifyCode.message,
        verifyCode.token
      );
    }
    return emitToSocket(
      "verify-forgot-password-code-failure",
      verifyCode.message
    );
  });

  socket.on("verify-reset-password-code", (token) => {
    if (!authController.verifyResetPasswordCode(token)) {
      return emitToSocket(
        "verify-reset-password-code-failure",
        "Invalid token"
      );
    }
    return true;
  });

  socket.on("reset-password", async (password, token) => {
    const resetPassword = await authController.resetPassword(password, token);
    if (resetPassword.success) {
      return emitToSocket(
        "reset-password-success",
        resetPassword.message,
        resetPassword.jwt
      );
    }
    return emitToSocket("reset-password-failure", resetPassword.message);
  });

  socket.on("delete-document", async (document, userId, token) => {
    const deleted = await documentsController.deleteDocument(
      document,
      userId,
      token
    );
    if (deleted.success) {
      return emitToSocket(
        "document-deleted",
        deleted.documentId,
        deleted.message
      );
    }
    return emitToSocket("unauthorized-document-delete", deleted.message);
  });

  socket.on("delete-permanently", async (token) => {
    const deleted = await usersController.deletePermanently(token);
    if (deleted.success) {
      return emitToSocket("user-deleted", deleted.message);
    }
    return emitToSocket("delete-permanently-failure", deleted.message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

isProduction &&
  http.listen(port, () => console.log("Server started on port", port));
