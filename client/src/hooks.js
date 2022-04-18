import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";

export const useNotification = ({ message, type }) => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (message) {
      setNotification({ message, type });
    }
  }, [message, type]);

  return { notification, setNotification };
};

export const useQuery = (queryName) => {
  const searchQueries = new URLSearchParams(useLocation().search);
  return searchQueries.get(queryName);
};

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);
    setSocket(s);

    return () => s.disconnect();
  }, []);

  return socket;
};

export const NotificationType = {
  ERROR: "error",
  SUCCESS: "success",
  WARNING: "warning",
  DISABLE: "disable",
};
