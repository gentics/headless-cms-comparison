import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { default as serverFetch } from "node-fetch";
import fs from "fs";

import App, { constructAppState } from "../src/App";
import { AppState, ReceivedCmsData } from "../src/Cms";
import CmsService from "../src/CmsService";
import { StaticRouter } from "react-router-dom";
const clientBuildPath = path.resolve(__dirname, "../client");

const createHtmlFiles = async (appState: AppState): Promise<void> => {
  const urls = ["/card", "/list", "/about"];
  try {
    await Promise.all(urls.map((url: string) => createHtmlFile(url, appState)));
  } catch (err) {
    throw new Error(`Creating HTML files failed: ${err}`);
  }
  return Promise.resolve();
};

const createHtmlFile = (url: string, appState: AppState): Promise<void> => {
  const html = renderToStaticMarkup(
    <StaticRouter location={url}>
      <App initialAppState={appState} />
    </StaticRouter>
  );

  return new Promise((resolve, reject) => {
    fs.mkdir(`/tmp${url}`, { mode: 0o755, recursive: true }, (err) => {
      err
        ? reject(err)
        : fs.writeFile(`/tmp${url}/index.html`, html, (err) =>
            err ? reject(err) : resolve()
          );
    });
  });
};

class ServerRenderer {
  async run() {
    let cmsData: ReceivedCmsData;
    try {
      cmsData = await CmsService.getCmsData(serverFetch);
    } catch (err) {
      console.error(`Fetching CMS data failed: ${err}`);
      return;
    }

    const appState: AppState = constructAppState(cmsData);

    try {
      await createHtmlFiles(appState);
    } catch (err) {
      console.error(`Server rendering failed: ${err}`);
    }
  }
}

export default ServerRenderer;
