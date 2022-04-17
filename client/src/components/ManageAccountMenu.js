import React from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link } from "react-router-dom";

function ManageAccountMenu() {
  return (
    <div className="manage-account-menu">
      <Link
        className="manage-account-menu-link"
        title="Manage account"
        to="/account"
      >
        <SettingsIcon />
        Manage account
      </Link>
      <Link className="manage-account-menu-link" title="Logout" to="/logout">
        <LogoutIcon />
        Logout
      </Link>
    </div>
  );
}

export default ManageAccountMenu;
