import React, { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

function PasswordField({ name, placeholder }) {
  const [showPassword, setShowPassword] = useState(false);

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="password-container">
      <input
        type={showPassword ? "text" : "password"}
        className={"password-input"}
        name={name}
        id={name}
        placeholder={placeholder}
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
  );
}

export default PasswordField;
