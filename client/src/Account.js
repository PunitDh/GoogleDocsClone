import { CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import "./account.css";
import { io } from "socket.io-client";
import Notification from "./components/Notification";
import { useNotification, useSocket } from "./hooks";
import JWTDecode from "jwt-decode";
import Dialog from "./components/Dialog";
import { Navigate } from "react-router-dom";
import AccountPasswordField from "./auth/AccountPasswordField";
import { generateHashedPassword, validatePassword } from "./auth/utils";

function Account({ token }) {
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const notification = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const currentUser = JWTDecode(token);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleUpdateAccount = (e) => {
    e.preventDefault();
    const firstName = e.target.firstName.value;
    const lastName = e.target.lastName.value;
    const email = e.target.email.value;

    if (socket?.connected) {
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

      socket.on("update-account-success", () => {
        notification.set("Account updated successfully", notification.SUCCESS);
      });

      socket.on("update-account-failure", (error) => {
        notification.set(error, notification.ERROR);
      });
    } else {
      notification.set("Failed to connect to server", notification.ERROR);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const oldPassword = e.target.oldPassword.value;
    const newPassword = e.target.newPassword.value;
    const newPasswordConfirmation = e.target.newPasswordConfirmation.value;

    if (!validatePassword(newPassword, newPasswordConfirmation, notification)) {
      return;
    }

    if (socket?.connected) {
      socket.emit(
        "change-password",
        {
          oldPassword,
          newPassword: generateHashedPassword(newPassword),
        },
        token
      );

      socket.on("change-password-success", (message) => {
        notification.set(message, notification.SUCCESS);
      });

      socket.on("change-password-failure", (message) => {
        notification.set(message, notification.ERROR);
      });
    } else {
      notification.set("Failed to connect to server", notification.ERROR);
    }
  };

  const handleDeleteAccount = (e) => {
    e.preventDefault();
    setShowModal(false);
    if (socket?.connected) {
      socket.emit("delete-permanently", token);
      socket.on("user-deleted", (message) => {
        notification.set(message, notification.SUCCESS);

        setTimeout(() => {
          setAccountDeleted(true);
        }, 1000);
      });

      socket.on("delete-permanently-failure", (message) => {
        notification.set(message, notification.SUCCESS);
      });
    } else {
      notification.set("Failed to connect to server", notification.ERROR);
    }
  };

  return (
    <>
      <Notification notification={notification} />
      {accountDeleted && <Navigate to="/logout" />}
      {
        <Dialog
          confirmationTitle="Confirm Delete"
          confirmationMessage="Are you sure you want to delete your account? All your documents will
          be permanently deleted. This operation is not reversible."
          setShowModal={setShowModal}
          showModal={showModal}
          onYes={handleDeleteAccount}
        />
      }
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
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    defaultValue={currentUser.firstName}
                    required
                  />
                </div>

                <div className="account-manage-form-control">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    defaultValue={currentUser.lastName}
                    required
                  />
                </div>

                <div className="account-manage-form-control">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
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
                <AccountPasswordField
                  name="oldPassword"
                  label="Current Password"
                />
                <AccountPasswordField name="newPassword" label="New Password" />
                <AccountPasswordField
                  name="newPasswordConfirmation"
                  label="Confirm New Password"
                />
                <div className="account-manage-form-control">
                  <label></label>
                  <button className="form-button">Change password</button>
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
                    onClick={() => setShowModal(true)}
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
