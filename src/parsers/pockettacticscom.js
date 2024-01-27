import { parseJson, sanitize } from "../util.js";
import { BaseParser } from "../base_parser.js";

const SOURCE_URL = "https://www.pockettactics.com/genshin-impact/codes";
const ROOT_SELECTOR = ".category-genshin-impact";
const LIST_SELECTORS = [
  ".post-6906 ul",
];
const DIVIDER = " – ";

export default class Parser extends BaseParser {
  constructor() {
    super();
    this.url = SOURCE_URL;
  }
  parse(rawList) {
    const parsed = [];
    for (const r of rawList) {
      let val = sanitize(r);
      const [code, ...description] = val.split(DIVIDER);
      parsed.push({
        code: code.trim().toUpperCase(),
        description: description.join(DIVIDER).trim(),
        source: this.url,
      });
    }
    return parsed;
  }
  async getCodes() {
    const page = await this.getPage();
    const codesUlSelector = LIST_SELECTORS.join(", ");
    await page.waitForSelector(ROOT_SELECTOR);
    const received = await page.evaluate((selector) => {
      const lists = document.querySelectorAll(selector);
      const items = [];
      for (const list of [...lists].slice(0, 2)) {
        for (const child of list.children) {
          items.push(child.innerText);
        }
      }
      return JSON.stringify(items);
    }, codesUlSelector);
    return this.parse(parseJson(received) || []);
  }
}
