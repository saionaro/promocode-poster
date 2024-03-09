import puppeteer from "puppeteer";
import { parseJson } from "../util.js";
import { logger } from "../log.js";
import { BaseEngine } from "./base.js"

const IGNORE_RESOURCES_REGEX = /youtube/i;

export class Engine extends BaseEngine {
  async init() {
    logger.info(`Launching Puppeteer for ${this.url}`);
    this.browser = await puppeteer.launch({
      // TODO: avoid sandbox disabling by launching app with no root access
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    return this;
  }
  async destroy() {
    await this.page.close();
    await this.browser.close();
    await super.destroy();
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
  async getCodes() {
    const page = await this.getPage();
    const codesUlSelector = this.listSelectors.join(", ");
    await page.waitForSelector(this.rootSelector);
    const received = await page.evaluate((selector) => {
      const lists = document.querySelectorAll(selector);
      const items = [];
      for (const list of lists) {
        for (const child of list.children) {
          items.push(child.innerText);
        }
      }
      return JSON.stringify(items);
    }, codesUlSelector);
    return this.filter(this.parse(parseJson(received) || []));
  }
}
