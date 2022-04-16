import React, { useEffect } from "react";
import { NotificationType } from "../hooks";
import DoneIcon from "@mui/icons-material/Done";
import CancelIcon from "@mui/icons-material/Cancel";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import "./notification.css";

function Notification({ message, type, setNotification }) {
  const handleClose = (time = 5000) => {
    setTimeout(() => {
      setNotification(false);
    }, time);
  };

  useEffect(() => {
    handleClose();
  }, [message, type]);

  return (
    <div className={`notification-container ${type}`}>
      <div className="notification-icon" onClick={() => handleClose(0)}>
        {type === NotificationType.SUCCESS && <DoneIcon />}
        {type === NotificationType.ERROR && <CancelIcon />}
        {type === NotificationType.WARNING && <PriorityHighIcon />}
      </div>
      {message}
    </div>
  );
}

export default Notification;
