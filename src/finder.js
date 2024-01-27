import { logger } from "./log.js";

export async function searchCodes(db, parsers) {
  logger.info("Start codes search");
  const foundCodes = [];
  const worker = await db.createWorker();

  for (const parser of parsers) {
    try {
      await parser.init();
      const codes = await parser.getCodes();
      await parser.destroy();

      for (const code of codes) {
        if (!worker.has(code.code)) {
          worker.add(code.code, code.description);
          foundCodes.push(code);
        }
      }
    } catch(e) {
      logger.error(e);
    }
  }

  await db.terminateWorker();

  if (foundCodes.length) {
    logger.info(`Found new codes: ${foundCodes.length}`);
  } else {
    logger.info("No new codes found");
  }

  return foundCodes;
}
