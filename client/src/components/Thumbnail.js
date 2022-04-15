import React from "react";
import { Link } from "react-router-dom";
import "../documents.css";

function Thumbnail({ link, display, title, create, visible }) {
  return (
    <div className={visible ? "document-container" : "hidden"}>
      <Link to={link} className={create ? "document" : "document-content"}>
        <pre>{display}</pre>
      </Link>
      <div className="document-thumbnail-title">{title}</div>
    </div>
  );
}

export default Thumbnail;
