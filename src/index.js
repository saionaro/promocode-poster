import "./config.js";
import { postCodes } from "./msg.js";
import { DB } from "./db.js";
import { logger } from "./log.js";
import { searchCodes } from "./finder.js";
import engines, { loadConfig } from "./engines/index.js";
import { join } from "path";
import { getBotKey } from "./util.js";

const { DB_DIR, NODE_ENV, PARSERS_CONFIG_PATH } = process.env;

export async function run(gameConfig, botKey) {
  logger.info(`Processing ${gameConfig.game} with ${gameConfig.parsers.length} parsers`);
  
  // Create database instance for this game
  const dbFilePath = join(DB_DIR, gameConfig.db_file);
  const db = new DB(dbFilePath);
  await db.init();
  
  // Create engine instances for this game's parsers
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

// Main execution logic
logger.info("Started");
logger.info(`NODE_ENV: ${NODE_ENV}`);

// Support comma-separated multiple config paths
const configPaths = PARSERS_CONFIG_PATH.split(',').map(path => path.trim());

// Process each config file
for (const configPath of configPaths) {
  const config = await loadConfig(configPath);
  const botKey = getBotKey(config);
  await run(config, botKey);
}

logger.info("Finished");
