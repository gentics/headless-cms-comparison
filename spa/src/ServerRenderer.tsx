import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { default as serverFetch } from "node-fetch";
import { Helmet } from "react-helmet";
import fs from "fs-extra";

import App from "./App";
import { AppState, ReceivedCmsData } from "./Cms";
import { getInitialAppStateFromServer } from "./CmsService";
import CmsList from "../../cms-list.json";

class ServerRenderer {
  private htmlSegments: string[] = [];
  private appState?: AppState;

  constructor(private sourceDir: string) {}

  public init(): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.readFile(`${this.sourceDir}/index.html`, "utf8", (err, htmlData) => {
        if (err) {
          return reject(
            `Failed reading ${this.sourceDir}/index.html: ${err.message}`
          );
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
      });
    });
  }

  public async create(outputDir: string): Promise<void> {
    let cmsData: ReceivedCmsData;
    try {
      this.appState = await getInitialAppStateFromServer(serverFetch);
    } catch (err) {
      console.error(`Fetching CMS data failed: ${err}`);
      return;
    }

    try {
      await this.copyFiles(outputDir);
      await this.createHtmlFiles(outputDir);
    } catch (err) {
      console.error(`Server rendering failed: ${err}`);
    }
  }

  private async copyFiles(outputDir: string): Promise<void> {
    await fs.copy(this.sourceDir, outputDir, {
      dereference: true,
      filter: (src: string, dest: string) => !src.match(/index\.html$/),
    });
  }

  private async createHtmlFiles(outputDir: string): Promise<void> {
    const urls = ["/", "/card", "/list", "/about"].concat(
      CmsList.cms.map((name: string) => `/detail/${name}`)
    );

    try {
      await Promise.all(
        urls.map((url: string) => this.createHtmlFile(outputDir, url))
      );
    } catch (err) {
      throw new Error(`Creating HTML files failed: ${err}`);
    }
    return Promise.resolve();
  }

  private createHtmlFile(outputDir: string, url: string): Promise<void> {
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
      const dir = path.resolve(outputDir, `./${url}`);
      fs.ensureDir(dir, { mode: 0o755 }, (err) => {
        err
          ? reject(err)
          : fs.writeFile(path.resolve(dir, "index.html"), html, (err) =>
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
