import { Engine as JSDOM } from "./jsdom.js";
import { BaseEngine as Base } from "./base.js";

export default {
  jsdom: JSDOM,
};

export const loadConfig = Base.loadConfig;
