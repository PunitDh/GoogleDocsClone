import React from "react";
import ArticleTwoToneIcon from "@mui/icons-material/ArticleTwoTone";

function Navbar() {
  return (
    <nav>
      <div className="icon-container">
        <ArticleTwoToneIcon
          className="document-icon"
          style={{ fontSize: "2.5rem" }}
        />
      </div>
      <div className="search-container"></div>
      <div></div>
    </nav>
  );
}

export default Navbar;
