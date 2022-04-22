import React from "react";
import "./auth.css";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useSocket, useNotification } from "../hooks";
import Notification from "../components/Notification";
import { authenticateUser } from "./utils";
import PasswordField from "./PasswordField";
import LeftSection from "./components/LeftSection";
import OmniAuth from "./components/OAuthButton";

function Login({ setToken, currentUser }) {
  const notification = useNotification();
  const socket = useSocket();

  const handleLogin = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const user = { email, password };

    socket.emit("login-user", user);

    if (socket.disconnected) {
      notification.set("Failed to connect to server", notification.ERROR);
      return;
    }

    socket.on("login-success", (jwt, message) => {
      if (authenticateUser(jwt, setToken)) {
        notification.set(message, notification.SUCCESS);
      }
    });

    socket.on("login-failure", (message) => {
      notification.set(message, notification.ERROR);
    });
  };

  return (
    <>
      <Notification notification={notification} />
      {currentUser && <Navigate to="/" />}
      <div className="container">
        <Navbar />

        <main className="auth-main">
          <LeftSection />
          <section>
            <form onSubmit={handleLogin}>
              <h2>Login to your account</h2>
              <input
                type="email"
                name="email"
                className="user-input"
                placeholder="Email"
              />
              <PasswordField name="password" placeholder="Password" />
              <div className="form-links-container">
                <button
                  className="form-link-button"
                  title="Log in to your account"
                >
                  Login
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
                  to="/forgot-password"
                  title="Click here if you've forgotten your password"
                >
                  Forgot password?
                </Link>
              </div>

              <hr className="thin-line" />
              <OmniAuth />
            </form>
          </section>
        </main>
      </div>
    </>
  );
}

export default Login;
