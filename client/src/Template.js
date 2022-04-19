import { CircularProgress } from "@mui/material";
import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Notification from "./components/Notification";
import { useNotification } from "./hooks";

function Template({ token, search, handleSearch, currentUser, children }) {
  const notification = useNotification();
  const [loading, setLoading] = useState(true);
  return (
    <>
      <Notification notification={notification} />
      <div className="container">
        <Navbar
          token={token}
          search={search}
          handleSearch={handleSearch}
          currentUser={currentUser}
        />
        {loading ? (
          <div className="loading-bar">
            <CircularProgress />
          </div>
        ) : (
          { children }
        )}
        <footer className="app-footer">
          Copyright 2022 - Punit Dharmadhikari
        </footer>
      </div>
    </>
  );
}

export default Template;
