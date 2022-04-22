import React, { useState, useRef, useEffect } from "react";
import DocumentIcon from "../assets/logo512.png";
import SearchTwoToneIcon from "@mui/icons-material/SearchTwoTone";
import ManageAccountMenu from "./ManageAccountMenu";
import { Link } from "react-router-dom";

function Navbar({ search, handleSearch, token, currentUser }) {
  const signedIn = Boolean(currentUser && token);
  const manageAccountMenuRef = useRef();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const checkOutsideClick = (e) => {
      if (showMenu && !manageAccountMenuRef?.current?.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("click", checkOutsideClick, false);

    return () => {
      document.removeEventListener("click", checkOutsideClick);
    };
  }, [showMenu]);

  return (
    <nav>
      <div className="icon-container">
        <Link to="/documents">
          <img
            className="document-icon"
            src={DocumentIcon}
            title="Punit Dh Docs"
          />
        </Link>
      </div>
      <div className="search-container">
        {signedIn && (
          <>
            <SearchTwoToneIcon className="search-icon" />
            <input
              className="search-input"
              type="search"
              value={search}
              onChange={handleSearch}
              placeholder="Search"
              title="Search anything"
            />
          </>
        )}
      </div>
      <div>
        {signedIn && (
          <div
            ref={manageAccountMenuRef}
            className="manage-account-link"
            title="Your Account"
            onClick={() => setShowMenu(true)}
          >
            {currentUser && currentUser.picture ? (
              <img
                className="manage-account-picture"
                src={currentUser.picture}
                alt={currentUser.name}
              />
            ) : (
              `${currentUser.firstName
                .charAt(0)
                .toUpperCase()}${currentUser.lastName.charAt(0).toUpperCase()}`
            )}

            {showMenu && <ManageAccountMenu />}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
