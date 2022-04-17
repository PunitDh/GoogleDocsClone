import { CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import "./account.css";
import { io } from "socket.io-client";
import { authenticateUser } from "./auth/auth";
import Notification from "./components/Notification";
import { NotificationType } from "./hooks";
import bcrypt from "bcryptjs";

function Account({ token, setToken, currentUser, setCurrentUser }) {
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);
    setSocket(s);

    return () => s.disconnect();
  }, []);

  const handleUpdateAccount = (e) => {
    e.preventDefault();
    const firstName = e.target.firstName.value;
    const lastName = e.target.lastName.value;
    const email = e.target.email.value;

    socket.emit(
      "update-account",
      {
        firstName,
        lastName,
        email,
        id: currentUser.id,
      },
      token
    );

    socket.on("update-account-success", (jwt) => {
      authenticateUser(jwt, setToken, currentUser, setCurrentUser);
      setNotification({
        message: "Account updated successfully",
        type: NotificationType.SUCCESS,
      });
    });

    socket.on("update-account-failure", (jwt) => {
      setNotification({
        message: "Failed to update account",
        type: NotificationType.ERROR,
      });
    });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const oldPassword = e.target.oldPassword.value;
    const newPassword = e.target.newPassword.value;
    const newPasswordConfirmation = e.target.newPasswordConfirmation.value;

    if (newPassword !== newPasswordConfirmation) {
      setNotification({
        message: "Passwords do not match",
        type: NotificationType.ERROR,
      });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt);

    socket.emit(
      "change-password",
      {
        oldPassword,
        newPassword: hashedNewPassword,
      },
      token
    );

    socket.on("change-password-success", (jwt) => {
      authenticateUser(jwt, setToken, currentUser, setCurrentUser);
      setNotification({
        message: "Password changed successfully",
        type: NotificationType.SUCCESS,
      });
    });

    socket.on("change-password-failure", (message) => {
      setNotification({
        message,
        type: NotificationType.ERROR,
      });
    });
  };

  const handleDeleteAccount = (e) => {
    e.preventDefault();
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
      <div className="container">
        <Navbar token={token} currentUser={currentUser} />
        {loading ? (
          <div className="loading-bar">
            <CircularProgress />
          </div>
        ) : (
          <main className="documents-main">
            <section>
              <h3>Manage your account</h3>
              <form
                className="account-manage-container"
                onSubmit={handleUpdateAccount}
              >
                <div className="account-manage-form-control">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    defaultValue={currentUser.firstName}
                    required
                  />
                </div>

                <div className="account-manage-form-control">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    defaultValue={currentUser.lastName}
                    required
                  />
                </div>

                <div className="account-manage-form-control">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={currentUser.email}
                    required
                  />
                </div>
                <div className="account-manage-form-control">
                  <label></label>
                  <button className="form-button">Update account</button>
                </div>
              </form>
            </section>

            <section>
              <h3>Change your password</h3>
              <form
                className="account-manage-container"
                onSubmit={handleChangePassword}
              >
                <div className="account-manage-form-control">
                  <label>Current Password</label>
                  <input type="password" name="oldPassword" />
                </div>

                <div className="account-manage-form-control">
                  <label>New Password</label>
                  <input type="password" name="newPassword" />
                </div>

                <div className="account-manage-form-control">
                  <label>Confirm New Password</label>
                  <input type="password" name="newPasswordConfirmation" />
                </div>
                <div className="account-manage-form-control">
                  <label></label>
                  <button type="button" className="form-button">
                    Change password
                  </button>
                </div>
              </form>
            </section>

            <section>
              <h3>Delete account permanently</h3>
              <div className="account-manage-container">
                <div className="account-manage-form-control">
                  <label>Delete permanently?</label>
                  <button
                    className="form-button delete-account-button"
                    onClick={handleDeleteAccount}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </section>
          </main>
        )}
      </div>
    </>
  );
}

export default Account;
