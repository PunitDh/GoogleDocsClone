import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import "./documents.css";
import ArticleTwoToneIcon from "@mui/icons-material/ArticleTwoTone";
import SearchTwoToneIcon from "@mui/icons-material/SearchTwoTone";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import Thumbnail from "./components/Thumbnail";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";

function Documents({ currentUser, token }) {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [socket, setSocket] = useState(null);
  const manageAccountMenuRef = useRef();
  const container = useRef();
  const [showManageAccountMenu, setShowManageAccountMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(e.target.value);
  };

  useEffect(() => {
    const checkOutsideClick = (e) => {
      if (
        showManageAccountMenu &&
        !manageAccountMenuRef?.current?.contains(e.target)
      ) {
        setShowManageAccountMenu(false);
      }
    };
    document.addEventListener("click", checkOutsideClick, false);

    return () => {
      document.removeEventListener("click", checkOutsideClick);
    };
  }, [showManageAccountMenu]);

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);
    setSocket(s);

    s.emit("get-documents", currentUser.id, token);
    s.on("load-documents", (documents) => {
      setDocuments(
        documents.map((document) => {
          const title = document.title || `Document ${document._id}`;
          const maxLength = 23;

          return {
            ...document,
            title:
              title.length > maxLength
                ? title.slice(0, maxLength) + "..."
                : title,
            visible: true,
            data:
              document.data?.ops instanceof Array
                ? document.data.ops.map((op) => op.insert).join("")
                : document.data,
          };
        })
      );
    });

    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (socket)
      socket.on("document-deleted", (id) => {
        setDocuments(documents.filter((document) => document._id !== id));
      });
  }, [documents]);

  useEffect(() => {
    if (search === "") {
      setDocuments(
        documents.map((document) => ({ ...document, visible: true }))
      );
      return;
    }

    documents.forEach((it) => {
      if (
        it.title.toLowerCase().includes(search.toLowerCase()) ||
        it.data.toLowerCase().includes(search.toLowerCase())
      ) {
        it.visible = true;
      } else {
        it.visible = false;
      }
    });
  }, [search]);

  return (
    <div ref={container} className="container">
      <nav>
        <div className="icon-container">
          <ArticleTwoToneIcon
            className="document-icon"
            style={{ fontSize: "2.5rem" }}
          />
        </div>
        <div className="search-container">
          <SearchTwoToneIcon className="search-icon" />
          <input
            className="search-input"
            type="search"
            value={search}
            onChange={handleSearch}
            placeholder="Search"
          />
        </div>
        <div>
          <div
            ref={manageAccountMenuRef}
            className="manage-account-link"
            onClick={() => setShowManageAccountMenu(true)}
          >
            {currentUser &&
              `${currentUser.firstName
                .at(0)
                .toUpperCase()}${currentUser.lastName.at(0).toUpperCase()}`}

            <div
              className={`manage-account-menu ${
                showManageAccountMenu ? "" : "hidden"
              }`}
            >
              <Link
                className="manage-account-menu-link"
                title="Manage account"
                to="#manage"
              >
                <SettingsIcon />
                Manage account
              </Link>
              <Link
                className="manage-account-menu-link"
                title="Logout"
                to="/logout"
              >
                <LogoutIcon />
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="documents-main">
        <section>
          <h3>Start a new document</h3>
          <div className="content">
            <Thumbnail
              link={`/documents/${uuidV4()}`}
              display="+"
              create
              title="Blank Document"
              visible={true}
            />
            <Thumbnail
              link={`/documents/${uuidV4()}`}
              display={<GroupAddIcon className="public-document-icon" />}
              create
              title="Public Document"
              visible={true}
            />
          </div>
        </section>
        <section>
          <h3>Recent documents</h3>
          <div className="content">
            {documents.map((document) => (
              <Thumbnail
                key={document._id}
                id={document._id}
                link={`/documents/${document._id}`}
                display={document.data}
                title={document.title}
                visible={document.visible}
                socket={socket}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Documents;
