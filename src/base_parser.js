import puppeteer from "puppeteer";
import prettyBytes from "pretty-bytes";
import { logger } from "./log.js";

const IGNORE_RESOURCES_REGEX = /youtube/i;
export class BaseParser {
  constructor() {
    this.url = null;
    this.browser = null;
    this.bytesTransferred = 0;
  }
  async init() {
    logger.info(`Launching Puppeteer for ${this.url}`);
    this.browser = await puppeteer.launch();
    return this;
  }
  async destroy() {
    await this.page.close();
    await this.browser.close();
    logger.info(
      `Network usage [${prettyBytes(this.bytesTransferred)}] by ${this.url}`
    );
  }
  async getPage() {
    const SKIP_RESOURCES = ["image", "stylesheet", "font", "script", "fetch", "xhr"];

    this.page = await this.browser.newPage();
    await this.page.setRequestInterception(true);
    this.page.on("request", (request) => {
      if (IGNORE_RESOURCES_REGEX.test(request.url())) {
        return void request.abort();
      }
      if (SKIP_RESOURCES.indexOf(request.resourceType()) !== -1) {
        return void request.abort();
      }
      request.continue();
    });
    this.page.on("response", async (response) => {
      const headers = response.headers();
      let bytes = Number(headers["content-length"]) || 0;
      if (!bytes) {
        const buffer = await response.buffer();
        bytes = buffer.byteLength;
      }
      this.bytesTransferred += bytes;
    });
    await this.page.goto(this.url);
    return this.page;
  }
}
