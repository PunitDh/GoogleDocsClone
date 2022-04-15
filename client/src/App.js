import TextEditor from "./TextEditor";
import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Documents from "./Documents";

function App() {
  const [socket, setSocket] = useState(null);

  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Navigate to="/documents/" />} />
        <Route
          path="/documents/:id"
          element={<TextEditor socket={socket} setSocket={setSocket} />}
        />
        <Route path="/documents/" element={<Documents socket={socket} />} />
      </Routes>
    </Router>
  );
}

export default App;
