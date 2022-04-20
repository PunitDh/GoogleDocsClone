import bcrypt from "bcryptjs";
import jwtDecode from "jwt-decode";

export const generateHashedPassword = (password) => {
  const salt = bcrypt.genSaltSync(Number(process.env.REACT_APP_SALT_ROUNDS));
  return bcrypt.hashSync(password, salt);
};

export function authenticateUser(jwt, setToken) {
  if (jwt) {
    localStorage.setItem(process.env.REACT_APP_TOKEN_NAME, jwt);
    setToken(jwt);
    return jwt;
  }
  return false;
}

export function JWTDecode(jwt) {
  return jwt && jwtDecode(jwt.split(" ")[1]);
}

export function validatePassword(password, confirmationPassword, notification) {
  if (password.length < 8) {
    notification.set(
      "Password must be at least 8 characters long",
      notification.ERROR
    );
    return false;
  }

  if (!/[A-Z]/.test(password)) {
    notification.set(
      "Password must contain at least one uppercase letter",
      notification.ERROR
    );
    return false;
  }

  if (password !== confirmationPassword) {
    notification.set("Passwords do not match", notification.ERROR);
    return false;
  }

  return true;
}
