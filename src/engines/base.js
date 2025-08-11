import fs from "fs/promises";
import prettyBytes from "pretty-bytes";
import { exists } from "../util.js";
import { sanitize, path2Absolute } from "../util.js";
import { logger } from "../log.js";

const MAX_CODE_LEN = 15;
const DENIED_SYMBOLS = "!#@: ".split("");

export class BaseEngine {
  constructor(meta) {
    this.name = meta.name;
    this.url = meta.source_url;
    this.rootSelector = meta.root_selector;
    this.listSelectors = meta.list_selectors;
    this.divider = meta.divider;
    this.browser = null;
    this.bytesTransferred = 0;
  }
  static async loadConfig(rawPath) {
    const cfgPath = path2Absolute(rawPath);
    console.log(`Loading parsers config from: ${cfgPath}`);
    if (!(await exists(cfgPath))) {
      logger.error(`Parsers config is not found at: ${cfgPath}`);
      process.exit(1);
    }

    try {
      const content = await fs.readFile(cfgPath, "utf-8");
      const config = JSON.parse(content);
      
      return config;
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }
  }
  async init() {
    throw new Error("init method needs to be implemented");
  }
  async destroy() {
    logger.info(
      `Network usage [${prettyBytes(this.bytesTransferred)}] by ${this.name}`
    );
  }
  async getPage() {
    throw new Error("getPage method needs to be implemented");
  }
  async getCodes() {
    throw new Error("getPage method needs to be implemented");
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
        sourceName: this.name,
      });
    }
    return parsed;
  }
  filter(rawList) {
    return rawList.filter((codeRecord) => {
      if (codeRecord.code.length > MAX_CODE_LEN) return false;
      if (DENIED_SYMBOLS.some((sym) => codeRecord.code.includes(sym)))
        return false;
      if (!codeRecord.description) return false;
      return true;
    });
  }
}
