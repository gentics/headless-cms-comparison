import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { default as serverFetch } from "node-fetch";
import fs from "fs";

import App, { constructAppState } from "../src/App";
import { AppState, ReceivedCmsData } from "../src/Cms";
import CmsService from "../src/CmsService";
import CmsList from "../../cms-list.json";

const clientBuildPath = path.resolve(__dirname, "../client");

class ServerRenderer {
  private htmlHeader?: string;
  private htmlFooter?: string;
  private appState?: AppState;

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.readFile("public/index.html", "utf8", (err, htmlData) => {
        if (err) {
          reject(`Failed reading index.html: ${err.message}`);
        }

        const segments = htmlData.split('<div id="root">');
        this.htmlHeader = `${segments[0]}<div id="root">`;
        this.htmlFooter = segments[1];
        resolve();
      });
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

    const html = context.url
      ? this.renderRedirect(context.url)
      : this.renderFullHtml(htmlBody);

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

  private renderFullHtml(body: string): string {
    return `${this.htmlHeader}${body}${this.htmlFooter}`;
  }
}

export default ServerRenderer;
