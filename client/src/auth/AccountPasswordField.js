import React, { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

function AccountPasswordField({ name, label }) {
  const [showPassword, setShowPassword] = useState(false);

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="account-manage-form-control-password">
      <label htmlFor={name}>{label}</label>
      <div className="account-manage-form-password-container">
        <input
          id={name}
          type={showPassword ? "text" : "password"}
          name={name}
        />
        {showPassword ? (
          <span title="Hide password">
            <VisibilityOffIcon
              onClick={handleShowPassword}
              className="account-password-eye"
            />
          </span>
        ) : (
          <span title="Show password">
            <VisibilityIcon
              onClick={handleShowPassword}
              className="account-password-eye"
            />
          </span>
        )}
      </div>
    </div>
  );
}

export default AccountPasswordField;
