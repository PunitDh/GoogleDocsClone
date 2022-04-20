import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Notification from "../components/Notification";
import { useNotification } from "../hooks";
import LeftSection from "./components/LeftSection";

function Forgot({ socket }) {
  const notification = useNotification();
  const [code, setCode] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  const handleForgot = (e) => {
    e.preventDefault();
    if (socket?.connected) {
      if (e.target.email.value) {
        socket.emit("forgot-password", e.target.email.value);
      } else {
        notification.set("Please enter your email", "error");
      }

      socket.on("forgot-password-success", (message) => {
        notification.set(message, notification.SUCCESS);
        setCode(true);
      });

      socket.on("forgot-password-failure", (error) => {
        notification.set(error, notification.ERROR);
      });
    } else {
      notification.set("Failed to connect to server", notification.ERROR);
    }
  };

  const handleCode = (e) => {
    e.preventDefault();
    if (socket?.connected) {
      if (e.target.code.value) {
        socket.emit(
          "verify-forgot-password-code",
          e.target.email.value,
          e.target.code.value
        );

        socket.on("verify-forgot-password-code-success", (message, token) => {
          notification.set(message, notification.SUCCESS);
          setCode(false);
          setCodeVerified(token);
        });

        socket.on("verify-forgot-password-code-failure", (error) => {
          notification.set(error, notification.ERROR);
        });
      } else {
        notification.set("Please enter your code", notification.ERROR);
      }
    } else {
      notification.set("Failed to connect to server", notification.ERROR);
    }
  };

  return (
    <>
      <Notification notification={notification} />
      {codeVerified && <Navigate to={`/reset-password?code=${codeVerified}`} />}
      <div className="container">
        <Navbar />

        <main className="auth-main">
          <LeftSection />
          <section>
            <form onSubmit={code ? handleCode : handleForgot}>
              <h2>Reset your password</h2>
              <input
                type="email"
                name="email"
                className="user-input"
                placeholder="Email"
                disabled={code}
              />
              {code && (
                <>
                  <input
                    type="number"
                    name="code"
                    className="user-input code-input"
                    placeholder="Your 6-digit code"
                    autoComplete="off"
                    max={999999}
                    min={100000}
                    maxLength={6}
                  />
                  <div className="form-helper-text">
                    Your 6-digit password reset code has been sent to your
                    email. Please enter the code above.
                  </div>
                </>
              )}
              <div className="form-links-container">
                <button
                  className="form-link-button"
                  title={code ? "Verify code" : "Reset your password"}
                >
                  {code ? "Verify code" : "Reset Password"}
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

export default Forgot;
