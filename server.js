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
const JWT = require("jsonwebtoken");
const http = isProduction && require("http").Server(app);
const port = process.env.PORT || 3010;
let io;

console.log({ isProduction });

isProduction && app.use(cors());
isProduction && app.use(express.static(__dirname));

console.log("Server starting...");

isProduction &&
  app.use(express.static(path.join(__dirname, "client", "build")));

isProduction &&
  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB database...");
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB database", err);
  });

if (isProduction) {
  io = require("socket.io")(http);
} else {
  io = require("socket.io")(process.env.PORT || 3001, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });
}

const defaultValue = "";

io.on("connection", (socket) => {
  console.log("Web socket connected to socketID:", socket.id);

  socket.on("get-documents", async (userId) => {
    const user = await User.findById(userId);
    console.log({ user });
    if (user.superUser) {
      const documents = await Document.find().sort({ updatedAt: -1 });
      socket.emit("load-documents", documents);
    } else {
      const documents = await Document.find({
        userId: user._id,
        public: true,
      }).sort({
        updatedAt: -1,
      });
      socket.emit("load-documents", documents);
    }
  });

  socket.on("login-user", async (user) => {
    const userData = await User.findOne({ email: user.email });
    if (userData) {
      if (bcrypt.compareSync(user.password, userData.password)) {
        console.log("Login success");

        const currentUser = {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          id: userData._id,
        };

        console.log({ currentUser });

        const jwt = JWT.sign(currentUser, process.env.JWT_SECRET, {
          expiresIn: "24h",
        });

        io.to(socket.id).emit("login-success", `Bearer ${jwt}`, currentUser);
      } else {
        console.log("Wrong password");
        io.to(socket.id).emit("login-failure", "Wrong password");
      }
    } else {
      console.log("User not found");
      io.to(socket.id).emit("login-failure", "User not found");
    }
  });

  socket.on("register-user", async (user) => {
    console.log({ user });
    const newUser = await User.findOne({ email: user.email });
    if (newUser) {
      console.log("Already exists");
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
        await newUser.save();
        io.to(socket.id).emit("user-registered-success", newUser);
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
    const deleted = await Document.findByIdAndDelete(documentId);
    console.log("Document deleted", deleted);
    socket.emit("document-deleted", documentId);
  });

  socket.on("get-document", async (documentId, userId) => {
    const document = await findOrCreateDocument(documentId, userId);
    socket.join(documentId);
    socket.emit("load-document", document);

    socket.on("send-changes", (delta) => {
      console.log(delta);
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      console.log("Saving Document", { userId });
      const save = await Document.findByIdAndUpdate(documentId, { data });
      console.log("Document saved", save);
    });

    socket.on("set-title", async (title) => {
      const save = await Document.findByIdAndUpdate(documentId, { title });
      console.log("Title saved", save);
    });
  });
});

async function findOrCreateDocument(documentId, userId) {
  if (documentId == null) return;
  const document = await Document.findById(documentId);
  const user = await User.findById(userId);
  if (document?.userId === user._id) return document;
  return await Document.create({
    _id: documentId,
    data: defaultValue,
    userId: user._id,
  });
}

isProduction &&
  http.listen(port, () => console.log("Server started on port", port));
