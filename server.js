require("dotenv").config();
const mongoose = require("mongoose");
const Document = require("./Document");
const isProduction = process.env.NODE_ENV === "production";

console.log("Server starting...");

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB database...");
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB database", err);
  });

const io = require("socket.io")(process.env.PORT || 3001, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

// isProduction &&
//   app.get("*", (_, res) => {
//     res.sendFile(path.join(__dirname, "client", "build", "index.html"));
//   });

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
