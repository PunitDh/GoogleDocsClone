import React, { useEffect, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import "./documents.css";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import Thumbnail from "./components/Thumbnail";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar";
import CircularProgress from "@mui/material/CircularProgress";
import JWTDecode from "jwt-decode";
import Notification from "./components/Notification";
import Tooltip from "./components/Tooltip";
import { useNotification } from "./hooks";

function Documents({ token }) {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const notification = useNotification();

  const currentUser = JWTDecode(token);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(e.target.value);
  };

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);
    setSocket(s);

    s.emit("get-documents", token);

    s.on("load-documents", (documents) => {
      setDocuments(
        documents.map((document) => {
          const title = document.title || document._id;
          const maxLength = 18;

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
      setLoading(false);
    });

    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (socket?.connected) {
      socket.on("document-deleted", (documentId, message) => {
        setDocuments(
          documents.filter((document) => document._id !== documentId)
        );
        notification.set(message, notification.SUCCESS);
      });

      socket.on("unauthorized-document-delete", (message) => {
        notification.set(message, notification.ERROR);
      });
    }
  }, [documents]);

  useEffect(() => {
    if (search === "") {
      setDocuments(
        documents.map((document) => ({ ...document, visible: true }))
      );
      return;
    }

    documents.forEach((document) => {
      if (
        document.title.toLowerCase().includes(search.toLowerCase()) ||
        document.data.toLowerCase().includes(search.toLowerCase())
      ) {
        document.visible = true;
      } else {
        document.visible = false;
      }
    });
  }, [search]);

  return (
    <>
      <Notification notification={notification} />
      <div className="container">
        <Navbar
          token={token}
          search={search}
          handleSearch={handleSearch}
          currentUser={currentUser}
        />
        {loading ? (
          <div className="loading-bar">
            <CircularProgress />
          </div>
        ) : (
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
                  link={`/documents/${uuidV4()}?public=true`}
                  display={<GroupAddIcon style={{ fontSize: "2.5rem" }} />}
                  create
                  title={
                    <>
                      Public Document{" "}
                      <Tooltip text="[?]">
                        Public documents can be viewed by anyone
                      </Tooltip>
                    </>
                  }
                  visible={true}
                />
              </div>
            </section>
            <section>
              <h3>Recent documents</h3>
              <div className="content">
                {documents.map((doc) => (
                  <Thumbnail
                    key={doc._id}
                    documentId={doc._id}
                    link={`/documents/${doc._id}`}
                    display={doc.data}
                    title={doc.title}
                    author={doc.author}
                    visible={doc.visible}
                    socket={socket}
                    userId={currentUser.id}
                  />
                ))}
              </div>
            </section>
          </main>
        )}
      </div>
    </>
  );
}

export default Documents;
