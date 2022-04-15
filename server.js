require("dotenv").config();
const isProduction = process.env.NODE_ENV === "production";
const path = require("path");
const mongoose = require("mongoose");
const Document = require("./models/Document");
const User = require("./models/User");
const express = require("express");
const app = isProduction && express();
const cors = require("cors");
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

  socket.on("get-documents", async () => {
    const documents = await Document.find().sort({ updatedAt: -1 });
    socket.emit("load-documents", documents);
  });

  socket.on("delete-document", async (documentId) => {
    const deleted = await Document.findByIdAndDelete(documentId);
    console.log("Document deleted", deleted);
    socket.emit("document-deleted", documentId);
  });

  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document);

    socket.on("send-changes", (delta) => {
      console.log(delta);
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      const save = await Document.findByIdAndUpdate(documentId, { data });
      console.log("Document saved", save);
    });

    socket.on("set-title", async (title) => {
      const save = await Document.findByIdAndUpdate(documentId, {
        title,
      });
      console.log("Title saved", save);
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}

isProduction &&
  http.listen(port, () => console.log("Server started on port", port));
