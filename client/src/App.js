import TextEditor from "./TextEditor";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Documents from "./Documents";
import Login from "./auth/Login";
import Register from "./auth/Register";
import JWTDecode from "jwt-decode";
import Logout from "./auth/Logout";
import Account from "./Account";
import Confirm from "./auth/Confirm";
import { authenticateUser } from "./auth/auth";

function App() {
  const [socket, setSocket] = useState();
  const [token, setToken] = useState(
    localStorage.getItem(process.env.REACT_APP_TOKEN_NAME)
  );
  const [currentUser, setCurrentUser] = useState(
    token ? JWTDecode(token) : null
  );
  const signedIn = Boolean(token && currentUser);

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);
    setSocket(s);

    if (token) {
      authenticateUser(token, setToken);
    } else {
      setCurrentUser(null);
    }

    s.emit("verify-token", token);
    s.on("verified-token", (currentUser) => {
      setCurrentUser(currentUser);
    });

    s.on("invalid-token", () => {
      setToken(null);
      localStorage.removeItem(process.env.REACT_APP_TOKEN_NAME);
      setCurrentUser(null);
    });

    return () => s.disconnect();
  }, [token]);

  return (
    <Router>
      <Routes>
        <Route
          exact
          path="/"
          element={
            signedIn ? <Navigate to="/documents/" /> : <Navigate to="/login/" />
          }
        />
        <Route
          path="/documents/:id"
          element={
            signedIn ? (
              <TextEditor socket={socket} setSocket={setSocket} token={token} />
            ) : (
              <Navigate to="/login/" />
            )
          }
        />
        <Route
          path="/documents/"
          element={
            signedIn ? <Documents token={token} /> : <Navigate to="/login/" />
          }
        />
        <Route
          path="/register/"
          element={
            signedIn ? (
              <Navigate to="/documents" />
            ) : (
              <Register setToken={setToken} currentUser={currentUser} />
            )
          }
        />
        <Route
          path="/login/"
          element={
            signedIn ? (
              <Navigate to="/documents/" />
            ) : (
              <Login setToken={setToken} currentUser={currentUser} />
            )
          }
        />
        <Route
          path="/account/"
          element={
            signedIn ? <Account token={token} /> : <Navigate to="/login/" />
          }
        />
        <Route
          path="/confirm-account"
          element={<Confirm setToken={setToken} />}
        />
        <Route path="/logout/" element={<Logout setToken={setToken} />} />
      </Routes>
    </Router>
  );
}

export default App;
