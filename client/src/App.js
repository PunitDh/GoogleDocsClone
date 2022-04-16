import TextEditor from "./TextEditor";
import { useState } from "react";
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

function App() {
  const [socket, setSocket] = useState();
  const [token, setToken] = useState(
    localStorage.getItem(process.env.REACT_APP_TOKEN_NAME)
  );
  const [currentUser, setCurrentUser] = useState(
    token ? JWTDecode(token) : null
  );
  const signedIn = Boolean(token && currentUser);

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
              <Documents socket={socket} currentUser={currentUser} />
            ) : (
              <Navigate to="/login/" />
            )
          }
        />
        <Route
          path="/register/"
          element={signedIn ? <Navigate to="/documents" /> : <Register />}
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
