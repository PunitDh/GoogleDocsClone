import React, { useEffect, useRef } from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

function Dialog({
  confirmationTitle,
  confirmationMessage,
  setShowModal,
  showModal,
  onYes,
}) {
  const yesButton = useRef();
  const noButton = useRef();

  const handleKeyDown = (e) => {
    switch (e.code) {
      case "Escape":
        setShowModal(false);
        break;
      case "ArrowRight":
        e.preventDefault();
        noButton.current.focus();
        break;
      case "ArrowLeft":
        e.preventDefault();
        yesButton.current.focus();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (showModal) {
      yesButton.current.addEventListener("keydown", handleKeyDown);
      yesButton.current.focus();
      noButton.current.addEventListener("keydown", handleKeyDown);
    }
  }, [showModal]);

  return (
    <dialog className="delete-confirmation-dialog" id="modal" open={showModal}>
      <div className="delete-confirmation-dialog-container">
        <div className="delete-confirmation-dialog-title">
          <WarningAmberIcon className="delete-confirmation-icon" />
          {confirmationTitle}
        </div>
        <div className="delete-confirmation-dialog-content">
          {confirmationMessage}
        </div>
        <div className="delete-confirmation-dialog-buttons-container">
          <button
            id="modal-yes-button"
            className="delete-confirmation-dialog-button"
            onClick={onYes}
            tabIndex="0"
            ref={yesButton}
          >
            Yes
          </button>
          <button
            id="modal-no-button"
            className="delete-confirmation-dialog-button"
            onClick={() => setShowModal(false)}
            tabIndex="1"
            ref={noButton}
          >
            No
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default Dialog;
