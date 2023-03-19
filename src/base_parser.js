import puppeteer from "puppeteer";
import { logger } from "./log.js";

export class BaseParser {
  constructor() {
    this.url = null;
    this.browser = null;
  }
  async init() {
    logger.info(`Launching Puppeteer for ${this.url}`);
    this.browser = await puppeteer.launch();
    return this;
  }
  async destroy() {
    await this.page.close();
    await this.browser.close();
  }
  async getPage() {
    const SKIP_RESOURCES = ["image", "stylesheet", "font", "script"];

    this.page = await this.browser.newPage();
    await this.page.setRequestInterception(true);

    this.page.on("request", (request) => {
      if (SKIP_RESOURCES.indexOf(request.resourceType()) !== -1) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await this.page.goto(this.url);
    return this.page;
  }
}
