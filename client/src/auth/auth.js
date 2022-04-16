export function authenticateUser(jwt, setToken, currentUser, setCurrentUser) {
  if (jwt) {
    localStorage.setItem(process.env.REACT_APP_TOKEN_NAME, jwt);
    setToken(jwt);
    setCurrentUser(currentUser);
    return true;
  }
  return false;
}
