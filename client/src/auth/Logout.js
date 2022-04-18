import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import "./auth.css";

function Logout({ setToken }) {
  const [logout, setLogout] = useState(false);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    localStorage.removeItem(process.env.REACT_APP_TOKEN_NAME);

    const dotInterval = setInterval(() => {
      setDots((dots) => dots + 1);
    }, 200);

    if (!localStorage.getItem(process.env.REACT_APP_TOKEN_NAME)) {
      setToken(null);
      setTimeout(() => {
        setLogout(true);
        clearInterval(dotInterval);
      }, 1000);
    }
  }, []);

  return (
    <>
      {logout ? (
        <Navigate to="/" />
      ) : (
        <div className="logout-message">Logging you out {".".repeat(dots)}</div>
      )}
    </>
  );
}

export default Logout;
