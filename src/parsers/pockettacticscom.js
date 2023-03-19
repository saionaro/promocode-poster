import { parseJson, sanitize } from "../util.js";
import { BaseParser } from "../base_parser.js";

export default class Parser extends BaseParser {
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
    const page = await this.getPage();
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
    return this.parse(parseJson(received) || []);
  }
}
