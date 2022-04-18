import React, { useState } from "react";
import { Link } from "react-router-dom";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import "../documents.css";
import "./thumbnail.css";
import Dialog from "./Dialog";

function Thumbnail({
  link,
  display,
  title,
  author,
  create,
  visible,
  documentId,
  socket,
}) {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = () => {
    if (socket) {
      socket.emit("delete-document", documentId);
      setShowModal(false);
    }
  };

  return (
    <>
      <div className={visible ? "thumbnail-container" : "hidden"}>
        <Link to={link} className={create ? "document" : "thumbnail-content"}>
          <pre>{display}</pre>
        </Link>
        {!create && (
          <DeleteForeverIcon
            className="delete-icon"
            onClick={() => setShowModal(true)}
          />
        )}
        <Link to={link} className="thumbnail-title-link">
          <div className="thumbnail-info">
            {!create && <strong>Title:</strong>} <span>{title}</span>
          </div>
          {author && (
            <div className="thumbnail-info">
              <strong>Author:</strong> {author}
            </div>
          )}
        </Link>
      </div>
      {!create && (
        <Dialog
          confirmationTitle="Confirm Delete"
          confirmationMessage={`Are you sure you want to delete ${title}?`}
          setShowModal={setShowModal}
          showModal={showModal}
          handleDelete={handleDelete}
        />
      )}
    </>
  );
}

export default Thumbnail;
