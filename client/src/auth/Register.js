import React, { useState } from "react";
import "./auth.css";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Link, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Notification from "../components/Notification";
import { NotificationType, useSocket } from "../hooks";
import bcrypt from "bcryptjs";
import { authenticateUser } from "./auth";

function Register({ setToken, setCurrentUser, currentUser }) {
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const socket = useSocket();

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const salt = bcrypt.genSaltSync(10);
    const firstName = e.target.firstName.value;
    const lastName = e.target.lastName.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const passwordConfirmation = e.target.passwordConfirmation.value;
    if (password !== passwordConfirmation) {
      setNotification({
        message: "Passwords do not match",
        type: NotificationType.ERROR,
      });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = { firstName, lastName, email, password: hashedPassword };
    socket.emit("register-user", user);

    if (socket.disconnected) {
      setNotification({
        message: "Failed to connect to server",
        type: NotificationType.ERROR,
      });
      return;
    }

    socket.on("user-registered-success", (jwt, user) => {
      if (authenticateUser(jwt, setToken, user, setCurrentUser)) {
        setNotification({
          message: "Email address registered successfully",
          type: NotificationType.SUCCESS,
        });
      }
    });

    socket.on("user-registered-failure", (error) => {
      setNotification({
        message: error,
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
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  className="password-input"
                  name="password"
                  placeholder="Password"
                  required
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
                <input
                  type={showPassword ? "text" : "password"}
                  className="password-input"
                  name="passwordConfirmation"
                  placeholder="Password Confirmation"
                  required
                />
              </div>

              <div className="form-links-container">
                <Link
                  className="form-link"
                  to="/login"
                  title="Click here to log in to your account"
                >
                  Already have an account?
                </Link>
              </div>
              <div className="form-links-container">
                <button
                  className="form-link-button"
                  title="Register for a new account"
                >
                  Register
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

export default Register;
