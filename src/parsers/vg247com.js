import { parseJson, sanitize } from "../util.js";
import { BaseParser } from "../base_parser.js";

export default class Parser extends BaseParser {
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
    const page = await this.getPage();
    const codesUlSelector = ["#codes + ul", "#livestream + ul"].join(", ");
    await page.waitForSelector(".article_body_content");
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
    return this.parse(parseJson(received) || []);
  }
}
