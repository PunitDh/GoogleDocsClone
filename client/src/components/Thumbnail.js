import React, { useState } from "react";
import { Link } from "react-router-dom";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import "../documents.css";
import "./thumbnail.css";
import Dialog from "./Dialog";
import { JWTDecode } from "../auth/utils";

function Thumbnail({
  link,
  ownerId,
  display,
  title,
  author,
  create,
  visible,
  documentId,
  socket,
  token,
}) {
  const [showModal, setShowModal] = useState(false);
  console.log({ token });

  const currentUser = token && JWTDecode(token);

  const handleDelete = () => {
    if (socket?.connected) {
      socket.emit("delete-document", documentId, currentUser.id, token);
      setShowModal(false);
    }
  };

  return (
    <>
      <div className={visible ? "thumbnail-container" : "hidden"}>
        <Link to={link} className={create ? "document" : "thumbnail-content"}>
          <pre>{display}</pre>
        </Link>
        {!create && (currentUser.superUser || ownerId === currentUser.id) && (
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
          onYes={handleDelete}
        />
      )}
    </>
  );
}

export default Thumbnail;
