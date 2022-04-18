export function authenticateUser(jwt, setToken) {
  if (jwt) {
    localStorage.setItem(process.env.REACT_APP_TOKEN_NAME, jwt);
    setToken(jwt);
    return true;
  }
  return false;
}

export function validatePassword(password, confirmationPassword) {
  if (password.length <= 8) {
    return {
      error: "Password must be at least 8 characters long",
      valid: false,
    };
  } else if (!/[A-Z]/.test(password)) {
    return {
      error: "Password must contain at least one uppercase letter",
      valid: false,
    };
  }

  if (password !== confirmationPassword) {
    return {
      error: "Passwords do not match",
      valid: false,
    };
  }

  return { error: false, valid: true };
}
