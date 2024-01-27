import { BaseParser } from "../base_parser.js";

const SOURCE_URL = "https://www.vg247.com/genshin-impact-codes";
const ROOT_SELECTOR = ".article_body_content";
const LIST_SELECTORS = [
  "#codes + ul",
  "#codes + p + ul",
  "#livestream + ul",
  "#livestream + p + ul",
  "#livestream-codes + ul",
  "#livestream-codes + p + ul",
];
const DIVIDER = ": ";

export default class Parser extends BaseParser {
  constructor() {
    super();
    this.url = SOURCE_URL;
    this.rootSelector = ROOT_SELECTOR;
    this.listSelectors = LIST_SELECTORS;
    this.divider = DIVIDER;
  }
}
