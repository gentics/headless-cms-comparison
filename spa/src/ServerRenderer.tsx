import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { default as serverFetch } from "node-fetch";
import { Helmet } from "react-helmet";
import fs from "fs";

import App, { constructAppState } from "./App";
import { AppState, ReceivedCmsData } from "./Cms";
import CmsService from "./CmsService";
import CmsList from "../../cms-list.json";

const clientBuildPath = path.resolve(__dirname, "../client");

class ServerRenderer {
  private htmlSegments: string[] = [];
  private appState?: AppState;

  private init(path?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.readFile(
        `${path || clientBuildPath}/index.html`,
        "utf8",
        (err, htmlData) => {
          if (err) {
            return reject(`Failed reading index.html: ${err.message}`);
          }

          const splitter1 = "<title></title>";
          const splitter2 = '<div id="root"></div>';
          const segments1 = htmlData.split(splitter1);
          const segments2 = segments1[1].split(splitter2);
          this.htmlSegments = [
            segments1[0],
            segments2[0] + '<div id="root">',
            "</div>" + segments2[1],
          ];
          resolve();
        }
      );
    });
  }

  public async run(): Promise<void> {
    await this.init();
    let cmsData: ReceivedCmsData;
    try {
      cmsData = await CmsService.getCmsData(serverFetch);
    } catch (err) {
      console.error(`Fetching CMS data failed: ${err}`);
      return;
    }

    this.appState = constructAppState(cmsData);

    try {
      await this.createHtmlFiles();
    } catch (err) {
      console.error(`Server rendering failed: ${err}`);
    }
  }

  private async createHtmlFiles(): Promise<void> {
    const urls = ["/", "/card", "/list", "/about"].concat(
      CmsList.cms.map((name: string) => `/detail/${name}`)
    );

    try {
      await Promise.all(urls.map((url: string) => this.createHtmlFile(url)));
    } catch (err) {
      throw new Error(`Creating HTML files failed: ${err}`);
    }
    return Promise.resolve();
  }

  private createHtmlFile(url: string): Promise<void> {
    const context: { url?: string } = {};
    const htmlBody = renderToStaticMarkup(
      <StaticRouter location={url} context={context}>
        <App initialAppState={this.appState} />
      </StaticRouter>
    );
    const htmlHelmet = Helmet.renderStatic();

    const html = context.url
      ? this.renderRedirect(context.url)
      : this.renderFullHtml(htmlBody, htmlHelmet.title.toString());

    return new Promise((resolve, reject) => {
      fs.mkdir(`/tmp${url}`, { mode: 0o755, recursive: true }, (err) => {
        err
          ? reject(err)
          : fs.writeFile(`/tmp${url}/index.html`, html, (err) =>
              err ? reject(err) : resolve()
            );
      });
    });
  }

  private renderRedirect(url: string): string {
    return `<html><head><meta http-equiv="Refresh" content="0; url='${url}'" /></head></html>`;
  }

  private renderFullHtml(body: string, headElements: string): string {
    return "".concat(
      this.htmlSegments[0],
      headElements,
      this.htmlSegments[1],
      body,
      this.htmlSegments[2]
    );
  }
}

export default ServerRenderer;
