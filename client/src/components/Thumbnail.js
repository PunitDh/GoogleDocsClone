import React, { useState } from "react";
import { Link } from "react-router-dom";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import "../documents.css";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

function Thumbnail({
  link,
  display,
  title,
  create,
  visible,
  id,
  showModal,
  setShowModal,
  handleDelete,
}) {
  console.log({ id });

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
          handleDelete={() => handleDelete(id)}
          showModal={showModal}
        />
      )}
    </>
  );
}

export default Thumbnail;
