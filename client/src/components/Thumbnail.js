import React, { useState } from "react";
import { Link } from "react-router-dom";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import "../documents.css";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

function Thumbnail({ link, display, title, create, visible, id, socket }) {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = () => {
    console.log("Deleting document with id: ", id);
    console.log(socket);
    if (socket) {
      console.log("Sending delete request to server with id: ", id);
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
        <DeleteConfirmationModal
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
