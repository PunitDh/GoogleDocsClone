import React, { useState, useRef, useEffect } from "react";
import ArticleTwoToneIcon from "@mui/icons-material/ArticleTwoTone";
import SearchTwoToneIcon from "@mui/icons-material/SearchTwoTone";
import ManageAccountMenu from "./ManageAccountMenu";

function Navbar({ search, handleSearch, currentUser, token }) {
  const signedIn = Boolean(currentUser && token);
  const manageAccountMenuRef = useRef();
  const [showManageAccountMenu, setShowManageAccountMenu] = useState(false);

  useEffect(() => {
    const checkOutsideClick = (e) => {
      if (
        showManageAccountMenu &&
        !manageAccountMenuRef?.current?.contains(e.target)
      ) {
        setTimeout(() => {
          setShowManageAccountMenu(false);
        }, 300);
      }
    };
    document.addEventListener("click", checkOutsideClick, false);

    return () => {
      document.removeEventListener("click", checkOutsideClick);
    };
  }, [showManageAccountMenu]);

  return (
    <nav>
      <div className="icon-container">
        <ArticleTwoToneIcon
          className="document-icon"
          style={{ fontSize: "2.5rem" }}
        />
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
            />
          </>
        )}
      </div>
      <div>
        {signedIn && (
          <div
            ref={manageAccountMenuRef}
            className="manage-account-link"
            onClick={() => setShowManageAccountMenu(true)}
          >
            {currentUser &&
              `${currentUser.firstName
                .at(0)
                .toUpperCase()}${currentUser.lastName.at(0).toUpperCase()}`}

            {showManageAccountMenu && <ManageAccountMenu />}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
