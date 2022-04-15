import React, { useEffect, useState } from "react";
import { v4 as uuidV4 } from "uuid";
import "./documents.css";
import { io } from "socket.io-client";
import ArticleTwoToneIcon from "@mui/icons-material/ArticleTwoTone";
import SearchTwoToneIcon from "@mui/icons-material/SearchTwoTone";
import Thumbnail from "./components/Thumbnail";

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [socket, setSocket] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(e.target.value);
  };

  const handleDelete = (id) => {
    console.log("Deleting document with id: ", id);
    console.log(socket);
    if (socket) {
      console.log("Sending delete request to server with id: ", id);
      socket.emit("delete-document", id);
      setShowModal(false);
    }
    socket.on("document-deleted", (id) => {
      console.log("Document deleted: ", id);
      setDocuments(documents.filter((document) => document._id !== id));
    });
  };

  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);
    setSocket(s);
    s.emit("get-documents");
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

    console.log({ search: search });
  }, [search]);

  return (
    <div className="container">
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
        <div></div>
      </nav>

      <main>
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
                showModal={showModal}
                setShowModal={setShowModal}
                handleDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Documents;
