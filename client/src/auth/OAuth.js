import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useQuery } from "../hooks";
import { authenticateUser } from "./utils";

function OAuth({ setToken }) {
  const code = useQuery("code");
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);

    s.emit("google-auth-code", code);

    s.once("google-auth-code-success", (jwt) => {
      if (authenticateUser(jwt, setToken)) {
        setRedirect(true);
      }
    });

    return () => s.disconnect();
  }, []);

  return redirect && <Navigate to="/" />;
}

export default OAuth;
