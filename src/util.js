import { logger } from "./log.js";

export function parseJson(maybeJson) {
  try {
    const res = JSON.parse(maybeJson);
    if (Array.isArray(res)) {
      return res;
    } else {
      logger.error(`Undefined result type: [${typeof res}]`);
    }
  } catch (e) {
    logger.error(e.message);
  }
}

export function sanitize(val) {
  let res = val.replace(/\(new\!\)/gi, "").replace(/\s+/g, " ");
  res = res.trim();
  return res;
}
