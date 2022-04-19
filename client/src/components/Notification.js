import React, { useEffect } from "react";

import DoneIcon from "@mui/icons-material/Done";
import CancelIcon from "@mui/icons-material/Cancel";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import "./notification.css";

function Notification({ notification }) {
  let timeout;
  const handleClose = (time = notification.duration) => {
    timeout = setTimeout(() => {
      notification.set(false);
    }, time);
  };

  useEffect(() => {
    handleClose();

    return () => {
      clearTimeout(timeout);
    };
  }, [notification.message, notification.type]);

  return (
    notification.message && (
      <div className={`notification-container ${notification.type}`}>
        <div className="notification-icon" onClick={() => handleClose(0)}>
          {notification.type === notification.SUCCESS && <DoneIcon />}
          {notification.type === notification.ERROR && <CancelIcon />}
          {notification.type === notification.WARNING && <PriorityHighIcon />}
        </div>
        {notification.message}
      </div>
    )
  );
}

export default Notification;
