import "./config.js";
import { postCodes } from "./msg.js";
import { DB } from "./db.js";
import { logger } from "./log.js";
import { searchCodes } from "./finder.js";

const { DB_DIR, NODE_ENV, TELEGRAM_CHANNEL_ID } = process.env;

async function run() {
  logger.info("Started");
  logger.info(`NODE_ENV: ${NODE_ENV}`);
  logger.info(`TELEGRAM_CHANNEL_ID: ${TELEGRAM_CHANNEL_ID}`);
  const db = new DB(DB_DIR);
  await db.init();

  const new_codes = await searchCodes(db);

  if (new_codes.length) {
    await postCodes(new_codes);
  }
}

await run();
