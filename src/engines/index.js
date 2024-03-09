import { Engine as JSDOM } from "./jsdom.js";
import { Engine as Puppeteer } from "./puppeteer.js";
import { BaseEngine as Base } from "./base.js";

export default {
  jsdom: JSDOM,
  puppeteer: Puppeteer,
};

export const loadConfig = Base.loadConfig;
