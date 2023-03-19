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
