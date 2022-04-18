import { CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import { useQuery } from "../hooks";

function Confirm({ setToken }) {
  const token = useQuery("token");
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(-1);
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);

    s.emit("confirm-email", token);
    s.on("confirm-email-success", (jwt) => {
      setToken(jwt);
      setLoading(false);
      setSeconds(5);
    });
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (seconds > 0) {
      const secondsDisplay = setInterval(() => {
        setSeconds((seconds) => seconds - 1);
      }, 1000);

      if (seconds <= 0) {
        setRedirect(true);
      }

      return () => {
        clearInterval(secondsDisplay);
      };
    }
  }, [seconds]);

  return (
    <>
      {redirect && <Navigate to="/" />}
      <div className="container">
        <Navbar />
        {loading ? (
          <div className="loading-bar">
            <CircularProgress />
          </div>
        ) : (
          <main className="confirm-main">
            <section>
              <h3>Your account has been confirmed!</h3>
              <div className="content">
                You will be redirected automatically in {seconds} seconds.
              </div>
              <div className="content">
                <Link to="/">Click here</Link> if your browser does not redirect
                you automatically.
              </div>
            </section>
          </main>
        )}
      </div>
    </>
  );
}

export default Confirm;
