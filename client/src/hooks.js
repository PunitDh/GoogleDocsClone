import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";

export const useNotification = () => {
  const [notification, setNotification] = useState({
    message: null,
    type: null,
    duration: 5000,
  });

  return {
    message: notification.message,
    type: notification.type,
    duration: notification.duration,
    set: (message, type, duration = 5000) =>
      setNotification({ message, type, duration }),
    SUCCESS: "success",
    ERROR: "error",
    WARNING: "warning",
    DISABLED: "disabled",
  };
};

export const useDialog = () => {
  const nullState = {
    title: null,
    message: null,
    confirmText: null,
    cancelText: null,
    onConfirm: null,
    onCancel: null,
    show: false,
  };

  const [showDialog, setShowDialog] = useState(nullState);

  return {
    set: ({
      title,
      message,
      type,
      confirmText = "Confirm",
      cancelText = "Cancel",
      onConfirm,
      onCancel,
    }) =>
      setShowDialog({
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm,
        onCancel,
        show: true,
      }),
    hide: () => setShowDialog(nullState),
    title: showDialog.title,
    message: showDialog.message,
    type: showDialog.type,
    confirmText: showDialog.confirmText,
    cancelText: showDialog.cancelText,
    onConfirm: showDialog.onConfirm,
    onCancel: showDialog.onCancel,
    show: showDialog.show,
  };
};

export const useQuery = (queryName) =>
  new URLSearchParams(useLocation().search).get(queryName);

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);
    setSocket(s);

    return () => s.disconnect();
  }, []);

  return socket;
};
