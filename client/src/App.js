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

    s.emit("verify-token", token);
    s.on("verified-token", (currentUser) => {
      setCurrentUser(currentUser);
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
              <TextEditor
                socket={socket}
                setSocket={setSocket}
                currentUser={currentUser}
                token={token}
              />
            ) : (
              <Navigate to="/login/" />
            )
          }
        />
        <Route
          path="/documents/"
          element={
            signedIn ? (
              <Documents
                socket={socket}
                currentUser={currentUser}
                token={token}
              />
            ) : (
              <Navigate to="/login/" />
            )
          }
        />
        <Route
          path="/register/"
          element={
            signedIn ? (
              <Navigate to="/documents" />
            ) : (
              <Register
                setToken={setToken}
                setCurrentUser={setCurrentUser}
                currentUser={currentUser}
              />
            )
          }
        />
        <Route
          path="/login/"
          element={
            signedIn ? (
              <Navigate to="/documents/" />
            ) : (
              <Login
                setToken={setToken}
                setCurrentUser={setCurrentUser}
                currentUser={currentUser}
              />
            )
          }
        />
        <Route
          path="/account/"
          element={
            signedIn ? (
              <Account
                token={token}
                setToken={setToken}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
              />
            ) : (
              <Navigate to="/login/" />
            )
          }
        />
        <Route
          path="/logout/"
          element={
            <Logout setToken={setToken} setCurrentUser={setCurrentUser} />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
