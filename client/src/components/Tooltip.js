import React from "react";

function Tooltip({ text, children }) {
  return (
    <span className="tooltip" title={children}>
      {text}
    </span>
  );
}

export default Tooltip;
