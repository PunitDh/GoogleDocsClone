import React from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

function DeleteConfirmationDialog({
  title,
  setShowModal,
  showModal,
  handleDelete,
}) {
  return (
    <dialog className="delete-confirmation-dialog" id="modal" open={showModal}>
      <div className="delete-confirmation-dialog-container">
        <div className="delete-confirmation-dialog-title">
          <WarningAmberIcon className="delete-confirmation-icon" />
          Confirm Delete
        </div>
        <div className="delete-confirmation-dialog-content">
          Are you sure you want to delete {title}?
        </div>
        <div className="delete-confirmation-dialog-buttons-container">
          <button
            className="delete-confirmation-dialog-button"
            onClick={handleDelete}
          >
            Yes
          </button>
          <button
            className="delete-confirmation-dialog-button"
            onClick={() => setShowModal(false)}
          >
            No
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default DeleteConfirmationDialog;
