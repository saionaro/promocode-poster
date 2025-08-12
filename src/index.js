import "./config.js";
import { postCodes } from "./msg.js";
import { DB } from "./db.js";
import { logger } from "./log.js";
import { searchCodes } from "./finder.js";
import engines from "./engines/index.js";
import { join } from "path";
import { processConfigs } from "./util.js";

const { DB_DIR, NODE_ENV } = process.env;

export async function run(gameConfig, botKey) {
  logger.info(`Processing ${gameConfig.game} with ${gameConfig.parsers.length} parsers`);
  
  const dbFilePath = join(DB_DIR, gameConfig.db_file);
  const db = new DB(dbFilePath);
  await db.init();
  
  const parsers = gameConfig.parsers.map((cfg) => {
    const Engine = engines[cfg.engine] ?? engines.jsdom;
    return new Engine(cfg);
  });
  
  const newCodes = await searchCodes(db, parsers);
  
  if (newCodes.length) {
    logger.info(`Found ${newCodes.length} new codes for ${gameConfig.game}`);
    await postCodes(newCodes, gameConfig, botKey);
  } else {
    logger.info(`No new codes found for ${gameConfig.game}`);
  }
}

logger.info("Started");
logger.info(`NODE_ENV: ${NODE_ENV}`);

await processConfigs(async (config, botKey) => {
  await run(config, botKey);
});

logger.info("Finished");
