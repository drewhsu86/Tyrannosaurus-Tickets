import React, { useEffect, useState } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import Home from "./Home";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

const Main = ({ user: propUser }) => {
  const [user, setUser] = useState(propUser);

  useEffect(() => setUser(propUser), [propUser]);

  return (
    <main>
      <Switch>
        <Route exact path="/" render={() => <Home />} />
        <Route
          exact
          path="/signin"
          render={() => (user ? <Redirect to="/" /> : <SignIn />)}
        />
        <Route
          exact
          path="/signup"
          render={() => (user ? <Redirect to="/" /> : <SignUp />)}
        />
        {/* <Route exact path="/events/:id" render={() => <Event user={user} />} />
        <Route exact path="/events" render={() => <Events user={user} />} /> */}
      </Switch>
    </main>
  );
};

export default Main;
