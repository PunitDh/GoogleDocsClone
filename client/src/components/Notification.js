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

  const ICONS = {
    success: DoneIcon,
    error: CancelIcon,
    warning: PriorityHighIcon,
  };

  const Icon = ICONS[notification.type];

  return (
    notification.message && (
      <div
        className={`notification-container ${notification.type}`}
        onClick={() => handleClose(0)}
      >
        <div className="notification-icon">
          <Icon />
        </div>
        {notification.message}
      </div>
    )
  );
}

export default Notification;
