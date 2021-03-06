import React, { useState } from "react";
import tRexText from "../assets/t-rex-tickets-text.png";
import tRexLogo from "../assets/t-rex-line.png";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import Footer from "./shared/Footer";
import "./Home.css";
import LoggedIn from "./LoggedIn";

const Home = ({ user, setUser }) => {
  const [signInToggle, setSignInToggle] = useState(true);

  const signInToggleFalse = () => {
    setSignInToggle(false);
  };

  const signInToggleTrue = () => {
    setSignInToggle(true);
  };

  return (
    <>
      <div className="home-logo-div">
        <img className="t-rex-text" src={tRexText} alt="T-Rex Tickets" />
        <img className="t-rex-logo" src={tRexLogo} alt="" />
      </div>
      <div className="home-dynamic">
        {!user ? (
          signInToggle ? (
            <SignIn setUser={setUser} signInToggleFalse={signInToggleFalse} />
          ) : (
            <SignUp setUser={setUser} signInToggleTrue={signInToggleTrue} />
          )
        ) : (
          <LoggedIn user={user} />
        )}
      </div>
      {user ? <Footer page="home" /> : ""}
    </>
  );
};

export default Home;
