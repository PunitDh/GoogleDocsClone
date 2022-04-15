require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");
const Document = require("./Document");
const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http").Server(app);
const port = process.env.PORT || 3010;
const io = require("socket.io")(http);

app.use(cors());
app.use(express.static(__dirname));

console.log("Server starting...");

const isProduction = process.env.NODE_ENV === "production";

isProduction &&
  app.get("/", (_, res) => {
    res
      .status(200)
      .sendFile(path.join(__dirname, "client", "build", "index.html"));
  });

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

const defaultValue = "";

io.on("connection", (socket) => {
  console.log("Web socket connected to socketID:", socket.id);

  socket.on("get-documents", async () => {
    const documents = await Document.find();
    socket.emit("load-documents", documents);
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
