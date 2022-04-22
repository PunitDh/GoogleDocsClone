import React from "react";
import "./auth.css";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Notification from "../components/Notification";
import { useNotification, useSocket } from "../hooks";
import PasswordField from "./PasswordField";
import LeftSection from "./components/LeftSection";
import {
  authenticateUser,
  validatePassword,
  generateHashedPassword,
} from "./utils";
import OmniAuth from "./components/OAuthButton";

function Register({ setToken, currentUser }) {
  const notification = useNotification();
  const socket = useSocket();

  const handleRegister = (e) => {
    e.preventDefault();
    const firstName = e.target.firstName.value;
    const lastName = e.target.lastName.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const passwordConfirmation = e.target.passwordConfirmation.value;

    if (!validatePassword(password, passwordConfirmation, notification)) {
      return;
    }

    const user = {
      firstName,
      lastName,
      email,
      password: generateHashedPassword(password),
    };
    socket.emit("register-user", user);

    if (socket.disconnected) {
      notification.set("Failed to connect to server", notification.ERROR);
      return;
    }

    socket.on("user-registered-success", (jwt, message) => {
      if (authenticateUser(jwt, setToken)) {
        notification.set(message, notification.SUCCESS);
      }
    });

    socket.on("user-registered-failure", (message) => {
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
            <form onSubmit={handleRegister}>
              <h2>Register for an account</h2>
              <input
                type="text"
                name="firstName"
                className="user-input"
                placeholder="First Name"
                required
              />
              <input
                type="text"
                name="lastName"
                className="user-input"
                placeholder="Last Name"
                required
              />
              <input
                type="email"
                name="email"
                className="user-input"
                placeholder="Email"
                required
              />

              <PasswordField name="password" placeholder="Password" />
              <PasswordField
                name="passwordConfirmation"
                placeholder="Password Confirmation"
              />
              <div className="form-helper-text">
                Your password must be at least 8 characters long and must
                contain at least one uppercase character
              </div>
              <div className="form-links-container">
                <button
                  className="form-link-button"
                  title="Register for a new account"
                >
                  Register
                </button>
              </div>
              <div className="form-links-container">
                <Link
                  className="form-link"
                  to="/login"
                  title="Click here to log in to your account"
                >
                  Already have an account?
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

export default Register;
