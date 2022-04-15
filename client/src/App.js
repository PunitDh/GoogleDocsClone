import TextEditor from "./TextEditor";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Documents from "./Documents";

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Navigate to="/documents/" />} />
        <Route path="/documents/:id" element={<TextEditor />} />
        <Route path="/documents/" element={<Documents />} />
      </Routes>
    </Router>
  );
}

export default App;
