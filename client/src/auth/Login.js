import React, { useState } from "react";
import "./auth.css";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useSocket, NotificationType } from "../hooks";
import Notification from "../components/Notification";
import { authenticateUser } from "./auth";

function Login({ setToken, setCurrentUser, currentUser }) {
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const socket = useSocket();

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const user = { email, password };

    socket.emit("login-user", user);

    if (socket.disconnected) {
      setNotification({
        message: "Failed to connect to server",
        type: NotificationType.ERROR,
      });
      return;
    }

    socket.on("login-success", (jwt, user) => {
      if (authenticateUser(jwt, setToken, user, setCurrentUser)) {
        setNotification({
          message: "Login successful",
          type: NotificationType.SUCCESS,
        });
      }
    });

    socket.on("login-failure", (message) => {
      setNotification({
        message,
        type: NotificationType.ERROR,
      });
    });
  };

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          setNotification={setNotification}
        />
      )}
      {currentUser && <Navigate to="/" />}
      <div className="container">
        <Navbar />

        <main className="auth-main">
          <section>
            <h1>Build your awesome docs</h1>
            <h3>Create and collaborate in real time</h3>
          </section>
          <section>
            <form onSubmit={handleLogin}>
              <h2>Login to your account</h2>
              <input
                type="email"
                name="email"
                className="user-input"
                placeholder="Email"
              />
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  className="password-input"
                  name="password"
                  placeholder="Password"
                />
                {showPassword ? (
                  <span title="Hide password">
                    <VisibilityOffIcon
                      onClick={handleShowPassword}
                      className="password-eye"
                    />
                  </span>
                ) : (
                  <span title="Show password">
                    <VisibilityIcon
                      onClick={handleShowPassword}
                      className="password-eye"
                    />
                  </span>
                )}
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
                  to="/register"
                  title="Click here if you've forgotten your password"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="form-links-container">
                <button
                  className="form-link-button"
                  title="Log in to your account"
                >
                  Login
                </button>
              </div>
              <hr className="thin-line" />
            </form>
          </section>
        </main>
      </div>
    </>
  );
}

export default Login;
