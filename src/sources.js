import puppeteer from "puppeteer";
import { logger } from "./log.js";
import { parseJson } from "./util.js";

class PromoGrabber {
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
    await this.browser.close();
  }
  async openPage() {
    const SKIP_RESOURCES = ["image", "stylesheet", "font", "script"];

    const page = await this.browser.newPage();
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      if (SKIP_RESOURCES.indexOf(request.resourceType()) !== -1) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(this.url);
    return page;
  }
}

const sanitize = (val) => {
  let res = val.replace(/\(new\!\)/gi, "").replace(/\s+/g, " ");
  res = res.trim();
  return res;
};

class Vg247_com extends PromoGrabber {
  constructor() {
    super();
    this.url = "https://www.vg247.com/genshin-impact-codes";
  }
  parse(rawList) {
    const parsed = [];
    for (const r of rawList) {
      let val = sanitize(r);
      const [code, ...description] = val.split(" - ");
      parsed.push({
        code: code.toUpperCase(),
        description: description.join(" - "),
        source: this.url,
      });
    }
    return parsed;
  }
  async getCodes() {
    const page = await this.openPage();
    const codesUlSelector = "#codes + ul";
    await page.waitForSelector(codesUlSelector);
    const received = await page.evaluate((selector) => {
      const list = document.querySelector(selector);
      const items = [];
      for (const child of list.children) {
        items.push(child.innerText);
      }
      return JSON.stringify(items);
    }, codesUlSelector);
    await page.close();
    const list = parseJson(received) || [];
    return this.parse(list);
  }
}

class Pockettactics_com extends PromoGrabber {
  constructor() {
    super();
    this.url = "https://www.pockettactics.com/genshin-impact/codes";
  }
  parse(rawList) {
    const parsed = [];
    for (const r of rawList) {
      let val = sanitize(r);
      const [code, ...description] = val.split(/ [-–] /);
      parsed.push({
        code: code.toUpperCase(),
        description: description.join(" - "),
        source: this.url,
      });
    }
    return parsed;
  }
  async getCodes() {
    const page = await this.openPage();
    const codesUlSelector = ".post-6906 ul";
    await page.waitForSelector(codesUlSelector);
    const received = await page.evaluate((selector) => {
      const lists = document.querySelectorAll(selector);
      const list = lists[1];
      const items = [];
      for (const child of list.children) {
        items.push(child.innerText);
      }
      return JSON.stringify(items);
    }, codesUlSelector);
    await page.close();
    const list = parseJson(received) || [];
    return this.parse(list);
  }
}

export const sources = [Vg247_com, Pockettactics_com];
