import { BaseParser } from "../base_parser.js";

const SOURCE_URL = "https://gamerant.com/genshin-impact-redeem-code-livestream-codes-free-primogem-redemption/";
const ROOT_SELECTOR = ".article-body";
const LIST_SELECTORS = [
  ".content-block-regular ul",
];
const DIVIDER = " - ";

export default class Parser extends BaseParser {
  constructor() {
    super();
    this.url = SOURCE_URL;
    this.rootSelector = ROOT_SELECTOR;
    this.listSelectors = LIST_SELECTORS;
    this.divider = DIVIDER;
  }
}
