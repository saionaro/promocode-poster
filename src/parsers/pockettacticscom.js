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
    this.rootSelector = ROOT_SELECTOR;
    this.listSelectors = LIST_SELECTORS;
    this.divider = DIVIDER;
  }
}
