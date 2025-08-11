import "./config.js";
import { postCodes } from "./msg.js";
import { DB } from "./db.js";
import { logger } from "./log.js";
import { searchCodes } from "./finder.js";
import engines, { loadConfig } from "./engines/index.js";
import { join } from "path";

const { DB_DIR, NODE_ENV, PARSERS_CONFIG_PATH } = process.env;

export async function run() {
  logger.info("Started");
  logger.info(`NODE_ENV: ${NODE_ENV}`);
  
  // Support comma-separated multiple config paths
  const configPaths = PARSERS_CONFIG_PATH.split(',').map(path => path.trim());
  const gameConfigs = [];
  
  // Process each config file to extract game configurations and parsers
  for (const configPath of configPaths) {
    const { gameConfig, parsers } = await loadConfig(configPath);
    
    // Create database instance for this game
    const dbFilePath = join(DB_DIR, gameConfig.db_file);
    const db = new DB(dbFilePath);
    await db.init();
    
    // Create engine instances for this game's parsers
    const gameEngines = parsers.map((cfg) => {
      const Engine = engines[cfg.engine] ?? engines.jsdom;
      return new Engine(cfg);
    });
    
    gameConfigs.push({
      gameConfig,
      db,
      parsers: gameEngines
    });
  }
  
  // Process each game configuration
  for (const { gameConfig, db, parsers } of gameConfigs) {
    logger.info(`Processing ${gameConfig.game} with ${parsers.length} parsers`);
    
    const newCodes = await searchCodes(db, parsers);
    
    if (newCodes.length) {
      logger.info(`Found ${newCodes.length} new codes for ${gameConfig.game}`);
      await postCodes(newCodes, gameConfig);
    } else {
      logger.info(`No new codes found for ${gameConfig.game}`);
    }
  }

  logger.info("Finished");
}

await run();
