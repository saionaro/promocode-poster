import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import { logger } from "../log.js";
import { BaseEngine } from "./base.js"

export class Engine extends BaseEngine {
  async init() {
    logger.info(`Launching JSDOM for ${this.url}`);
    return this;
  }
  async getPage() {
    try {
      const res = await fetch(this.url)
      const resBlob = await res.blob();
      this.bytesTransferred += resBlob.size;
      return await resBlob.text()
    } catch(e) {
      logger.error(`Can not load ${this.url}`);
      logger.error(e.message);
      process.exit(1);
    }
  }
  async getCodes() {
    const pageContent = await this.getPage();
    const dom = new JSDOM(pageContent);
    const { document } = dom.window;
    const codesUlSelector = this.listSelectors.join(", ");
    const lists = document.querySelectorAll(codesUlSelector);
    const items = [];
    for (const list of lists) {
      for (const child of list.children) {
        items.push(child.textContent);
      }
    }
    return this.filter(this.parse(items || []));
  }
}
