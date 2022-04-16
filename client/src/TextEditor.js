import React, { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { Link, useParams } from "react-router-dom";
import CloseTwoToneIcon from "@mui/icons-material/CloseTwoTone";

const SAVE_INTERVAL_MS = 10000;
const TOOLBAR_OPTIONS = [
  [{ title: "" }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

function TextEditor({ socket, setSocket, currentUser }) {
  const { id: documentId } = useParams();
  const [quill, setQuill] = useState(null);
  const [title, setTitle] = useState(`Document ${documentId}`);

  const saveDocument = () => {
    socket.emit("save-document", quill.getContents());
  };

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);
    setSocket(s);
    window.scrollTo(0, 0);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document.data);
      quill.enable(true);
      setTitle(document.title);
    });

    socket.emit("get-document", documentId, currentUser.id);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };

    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  const handleTitleChange = (e) => {
    e.preventDefault();
    setTitle(e.target.value);
  };

  const saveTitle = () => {
    socket.emit("set-title", title);
  };

  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      saveDocument();
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapperRef.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  return (
    <div>
      <div className="document-title-container">
        <input
          className="document-title"
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e)}
          onBlur={saveTitle}
          title="Rename"
        />

        <Link to="/documents/" onClick={saveDocument} className="button-icon">
          <CloseTwoToneIcon />
        </Link>
      </div>

      <div className="container" ref={wrapperRef}></div>
    </div>
  );
}

export default TextEditor;
