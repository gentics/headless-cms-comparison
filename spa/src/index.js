import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter } from "react-router-dom";
import { getInitialAppStateFromServer } from "./CmsService";

getInitialAppStateFromServer()
  .then((appState) => {
    ReactDOM.hydrate(
      <React.StrictMode>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
          <App initialAppState={appState} />
        </BrowserRouter>
      </React.StrictMode>,
      document.getElementById("root")
    );
  })
  .catch(console.error);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
