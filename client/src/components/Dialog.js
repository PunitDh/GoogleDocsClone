import React, { useEffect, useRef } from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

function Dialog({ dialog }) {
  const yesButton = useRef();
  const noButton = useRef();

  const handleKeyDown = (e) => {
    switch (e.code) {
      case "Escape":
        dialog.hide();
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
    if (dialog.show) {
      yesButton.current.addEventListener("keydown", handleKeyDown);
      yesButton.current.focus();
      noButton.current.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      yesButton.current.removeEventListener("keydown", handleKeyDown);
      noButton.current.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialog.show]);

  return (
    <dialog
      className="delete-confirmation-dialog"
      id="modal"
      open={dialog.show}
    >
      <div className="delete-confirmation-dialog-container">
        <div className="delete-confirmation-dialog-title">
          <WarningAmberIcon className="delete-confirmation-icon" />
          {dialog.title}
        </div>
        <div className="delete-confirmation-dialog-content">
          {dialog.message}
        </div>
        <div className="delete-confirmation-dialog-buttons-container">
          <button
            id="modal-yes-button"
            className="delete-confirmation-dialog-button"
            onClick={dialog.onConfirm}
            tabIndex="0"
            ref={yesButton}
          >
            {dialog.confirmText}
          </button>
          <button
            id="modal-no-button"
            className="delete-confirmation-dialog-button"
            onClick={dialog.onCancel}
            tabIndex="1"
            ref={noButton}
          >
            {dialog.cancelText}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default Dialog;
