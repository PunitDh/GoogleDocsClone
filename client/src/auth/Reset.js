import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Notification from "../components/Notification";
import { useNotification, useQuery } from "../hooks";
import LeftSection from "./components/LeftSection";
import PasswordField from "./PasswordField";
import {
  authenticateUser,
  validatePassword,
  generateHashedPassword,
} from "./utils";

function Reset({ socket, setToken }) {
  const notification = useNotification();
  const code = useQuery("code");
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (!code) {
      setRedirect(true);
      return;
    } else {
      if (socket?.connected) {
        socket.emit("verify-reset-password-code", code);
        socket.on("verify-reset-password-code-failure", (error) => {
          notification.set(error, notification.ERROR);
          setRedirect(true);
        });
      } else {
        notification.set("Failed to connect to server", notification.ERROR);
        setRedirect(true);
      }
    }
  }, [code, socket]);

  const handleReset = (e) => {
    e.preventDefault();
    if (socket?.connected) {
      const password = e.target.password.value;
      const passwordConfirmation = e.target.passwordConfirmation.value;
      if (!validatePassword(password, passwordConfirmation, notification)) {
        return;
      }

      socket.emit("reset-password", generateHashedPassword(password), code);

      socket.on("reset-password-success", (message, jwt) => {
        notification.set(message, notification.SUCCESS);
        if (authenticateUser(jwt, setToken)) {
          setRedirect(true);
        }
      });

      socket.on("reset-password-failure", (error) => {
        notification.set(error, notification.ERROR);
      });
    } else {
      notification.set("Failed to connect to server", notification.ERROR);
    }
  };

  return (
    <>
      <Notification notification={notification} />

      {redirect && <Navigate to="/" />}

      <div className="container">
        <Navbar />

        <main className="auth-main">
          <LeftSection />
          <section>
            <form onSubmit={handleReset}>
              <h2>Enter new password</h2>
              <div className="form-helper-text">
                Your password must be at least 8 characters long and must
                contain at least one uppercase character
              </div>
              <PasswordField name="password" placeholder="New password" />
              <PasswordField
                name="passwordConfirmation"
                placeholder="Re-enter password"
              />
              <div className="form-links-container">
                <button className="form-link-button" title="Update password">
                  Update Password
                </button>
              </div>
              <div className="form-links-container">
                <Link
                  className="form-link"
                  to="/register"
                  title="Click here to register for a new account"
                >
                  Don't have an account?
                </Link>
                <Link
                  className="form-link"
                  to="/login"
                  title="Click here if to log in to your account"
                >
                  Already have an account?
                </Link>
              </div>

              <hr className="thin-line" />
            </form>
          </section>
        </main>
      </div>
    </>
  );
}

export default Reset;
