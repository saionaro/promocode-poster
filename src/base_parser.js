import puppeteer from "puppeteer";
import prettyBytes from "pretty-bytes";
import { parseJson, sanitize } from "./util.js";
import { logger } from "./log.js";

const IGNORE_RESOURCES_REGEX = /youtube/i;
const MAX_CODE_LEN = 15;
const DENIED_SYMBOLS = '!#@: '.split('');

export class BaseParser {
  constructor() {
    this.url = null;
    this.browser = null;
    this.bytesTransferred = 0;
  }
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
  parse(rawList) {
    const parsed = [];
    for (const r of rawList) {
      let val = sanitize(r);
      const [code, ...description] = val.split(this.divider);
      parsed.push({
        code: code.trim().toUpperCase(),
        description: description.join(this.divider).trim(),
        source: this.url,
      });
    }
    return parsed;
  }
  filter(rawList) {
    return rawList.filter(codeRecord=>{
      if (codeRecord.code.length > MAX_CODE_LEN)
        return false;
      if (DENIED_SYMBOLS.some(sym=>codeRecord.code.includes(sym)))
        return false;
      if (!codeRecord.description)
        return false;
      return true;
    });
  }
}
