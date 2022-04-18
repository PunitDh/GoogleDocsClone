import React, { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { Link, Navigate, useParams } from "react-router-dom";
import CloseTwoToneIcon from "@mui/icons-material/CloseTwoTone";
import { useQuery } from "./hooks";
import { CircularProgress } from "@mui/material";
import JWTDecode from "jwt-decode";

const SAVE_INTERVAL_MS = 10000;
const TOOLBAR_OPTIONS = [
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

function TextEditor({ socket, setSocket, token }) {
  const { id: documentId } = useParams();
  const query = useQuery("public");
  const [quill, setQuill] = useState(null);
  const [title, setTitle] = useState(`Document ${documentId}`);
  const [close, setClose] = useState(false);
  const [publicDocument, setPublicDocument] = useState(query === "true");
  const currentUser = JWTDecode(token);
  const [loading, setLoading] = useState(true);

  const saveDocument = () => {
    socket.emit("save-document", quill.getContents(), title, documentId);
  };

  const closeDocument = () => {
    saveDocument();
    setClose(true);
  };

  const handlePrivacyChange = (e) => {
    e.target.checked = !publicDocument;
    setPublicDocument(!publicDocument);
    socket.emit("change-privacy", e.target.checked);
  };

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);
    setSocket(s);
    window.scrollTo(0, 0);
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document?.data);
      quill.enable(true);
      setTitle(document?.title);
      setPublicDocument(document?.public);
      setLoading(false);
    });

    socket.emit(
      "get-document",
      documentId,
      title,
      publicDocument,
      currentUser.id,
      token
    );
  }, [socket, quill, documentId, publicDocument]);

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
    console.log(e.target.value);
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
    <div className="container">
      {close && <Navigate to="/documents" />}
      {loading ? (
        <div className="loading-bar">
          <CircularProgress />
        </div>
      ) : (
        <div className="document-title-container">
          <input
            className="document-title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={saveTitle}
            title="Rename document"
          />
          <div className="privacy-change-container">
            <input
              type="checkbox"
              id="public"
              checked={publicDocument}
              onChange={handlePrivacyChange}
            />{" "}
            <label htmlFor="public">Public?</label>
          </div>
          <div onClick={closeDocument} className="button-icon">
            <CloseTwoToneIcon />
          </div>
        </div>
      )}

      <div
        className={`container ${loading && "container-hidden"}`}
        ref={wrapperRef}
      ></div>
    </div>
  );
}

export default TextEditor;
