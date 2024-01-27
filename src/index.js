import "./config.js";
import { postCodes } from "./msg.js";
import { DB } from "./db.js";
import { logger } from "./log.js";
import { searchCodes } from "./finder.js";
import { Parser } from "./parser.js";

const {
  DB_DIR,
  NODE_ENV,
  TELEGRAM_CHANNEL_ID,
  PARSERS_CONFIG_PATH,
} = process.env;

async function run() {
  logger.info("Started");
  logger.info(`NODE_ENV: ${NODE_ENV}`);
  logger.info(`TELEGRAM_CHANNEL_ID: ${TELEGRAM_CHANNEL_ID}`);
  const db = new DB(DB_DIR);
  await db.init();

  const parsersConfig = await Parser.loadConfig(PARSERS_CONFIG_PATH);
  const parsers = parsersConfig.map(cfg=>new Parser(cfg));

  const newCodes = await searchCodes(db, parsers);

  if (newCodes.length) {
    await postCodes(newCodes);
  }

  logger.info("Finished");
}

await run();
