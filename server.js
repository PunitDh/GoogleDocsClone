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
const http = isProduction && require("http").Server(app);
const { authenticateUser, verifyJWT } = require("./auth");
const { sendConfirmationEmail, verifyConfirmation } = require("./mailer");
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
    console.log("Connected to MongoDB database: ", res.connections[0].name);
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB database", err);
  });

const defaultValue = "";

io.on("connection", (socket) => {
  console.log("Web socket connected to socketID:", socket.id);

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

  socket.on("get-documents", async (userId) => {
    const user = await User.findById(userId);
    if (!user) return;
    if (user.superUser) {
      const documents = await Document.find().sort({ updatedAt: -1 });
      socket.emit("load-documents", documents);
    } else {
      const documents = await Document.find({
        userId: user._id,
        public: false,
      }).sort({
        updatedAt: -1,
      });

      const publicDocuments = await Document.find({
        public: true,
      }).sort({
        updatedAt: -1,
      });

      documents.push(...publicDocuments);

      socket.emit("load-documents", documents);
    }
  });

  socket.on("confirm-email", async (token) => {
    const confirmed = await verifyConfirmation(token);
    if (confirmed) {
      io.to(socket.id).emit("confirm-email-success");
    } else {
      console.log("Failed to confirm email");
    }
  });

  socket.on("change-password", async (password, token) => {
    const decoded = verifyJWT(token);
    if (decoded) {
      const user = await User.findById(decoded.id);
      if (user) {
        if (bcrypt.compareSync(password.oldPassword, user.password)) {
          try {
            user.password = password.newPassword;
            await user.save();
            io.to(socket.id).emit("change-password-success");
          } catch (err) {
            console.log("Failed to save user");
            io.to(socket.id).emit(
              "change-password-failure",
              "Failed to update password"
            );
          }
        } else {
          io.to(socket.id).emit("change-password-failure", "Wrong password");
        }
      }
    } else {
      console.log("Failed to verify token");
      io.to(socket.id).emit("change-password-failure", "User is invalid");
    }
  });

  socket.on("delete-permanently", async (token) => {
    const decoded = verifyJWT(token);
    if (decoded) {
      const userId = decoded.id;
      const deletedDocuments = await Document.deleteMany({ userId });
      const deletedUser = await User.findByIdAndDelete(userId);
      if (deletedUser) {
        io.emit("user-deleted", deletedUser, deletedDocuments);
      }
    } else {
      console.log("Failed to verify token");
      io.to(socket.id).emit("delete-permanently-failure", "User is invalid");
    }
  });

  socket.on("login-user", async (user) => {
    const userData = await User.findOne({ email: user.email });
    if (userData) {
      if (bcrypt.compareSync(user.password, userData.password)) {
        console.log("Login success");
        const { jwt, user } = authenticateUser(userData);
        io.to(socket.id).emit("login-success", jwt, user);
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
    const userData = await User.findById(currentUser.id);
    if (userData) {
      userData.firstName = currentUser.firstName;
      userData.lastName = currentUser.lastName;
      userData.email = currentUser.email;
    }
    try {
      await userData.save();
      const { jwt, user } = authenticateUser(userData);
      io.to(socket.id).emit("update-account-success", jwt, user);
    } catch (err) {
      console.log("Failed to update account", err);
      io.to(socket.id).emit("update-account-failure", err);
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

        console.log("From registration", { userData });
        const { jwt, user } = authenticateUser(userData);

        sendConfirmationEmail(userData);

        io.to(socket.id).emit("user-registered-success", jwt, user);
      } catch (err) {
        console.log("Failed to save user", err);
        io.to(socket.id).emit(
          "user-registered-failure",
          "Failed to register user"
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
      console.log("User is not authorized to delete document");
      io.to(socket.id).emit("unauthorized", "User is not authorized");
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
