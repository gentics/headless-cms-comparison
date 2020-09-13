import path from "path";
import React from "react";
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import { default as serverFetch } from "node-fetch";

import App, { constructAppState } from "../src/App";
import { AppState, ReceivedCmsData } from "../src/Cms";
import CmsService from "../src/CmsService";
import { StaticRouter } from "react-router-dom";
const clientBuildPath = path.resolve(__dirname, "../client");

class ServerRenderer {
  run() {
    CmsService.getCmsData(serverFetch)
      .then(
        (cmsData: ReceivedCmsData) => constructAppState(cmsData),
        (error) => {
          throw new Error(`Fetching CMS data failed: ${error}`);
        }
      )
      .then(
        (appState: AppState) =>
          console.log(
            renderToStaticMarkup(
              <StaticRouter location="/card">
                <App initialAppState={appState} />
              </StaticRouter>
            )
          ),
        (error) => {
          throw new Error(`Constructing app state failed: ${error}`);
        }
      );
  }
}

export default ServerRenderer;
