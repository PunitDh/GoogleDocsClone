import React from "react";
import GoogleButton from "react-google-button";

function OmniAuth() {
  const handleOmniAuth = () => {
    window.location.href = process.env.REACT_APP_GOOGLE_OMNIAUTH_URL;
  };

  return <GoogleButton title="Sign in with Google" onClick={handleOmniAuth} />;
}

export default OmniAuth;
