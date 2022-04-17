import React, { useState } from "react";
import { Link } from "react-router-dom";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import "../documents.css";
import DeleteConfirmationDialog from "./Dialog";

function Thumbnail({ link, display, title, create, visible, id, socket }) {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = () => {
    if (socket) {
      socket.emit("delete-document", id);
      setShowModal(false);
    }
  };

  return (
    <>
      <div className={visible ? "document-container" : "hidden"}>
        <Link to={link} className={create ? "document" : "document-content"}>
          <pre>{display}</pre>
        </Link>
        {!create && (
          <DeleteForeverIcon
            className="delete-icon"
            onClick={() => setShowModal(true)}
          />
        )}
        <Link to={link} className="document-thumbnail-title-link">
          {title}
        </Link>
      </div>
      {!create && (
        <DeleteConfirmationDialog
          title={title}
          setShowModal={setShowModal}
          handleDelete={handleDelete}
          showModal={showModal}
        />
      )}
    </>
  );
}

export default Thumbnail;
