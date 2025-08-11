import "./config.js";
import { postCodes } from "./msg.js";
import { DB } from "./db.js";
import { logger } from "./log.js";
import { searchCodes } from "./finder.js";
import engines, { loadConfig } from "./engines/index.js";

const { DB_DIR, NODE_ENV, TELEGRAM_CHANNEL_ID, PARSERS_CONFIG_PATH } =
  process.env;

export async function run() {
  logger.info("Started");
  logger.info(`NODE_ENV: ${NODE_ENV}`);
  logger.info(`TELEGRAM_CHANNEL_ID: ${TELEGRAM_CHANNEL_ID}`);
  const db = new DB(DB_DIR);
  await db.init();
  
  // Support comma-separated multiple config paths
  const configPaths = PARSERS_CONFIG_PATH.split(',').map(path => path.trim());
  const allParsersConfig = [];
  
  for (const configPath of configPaths) {
    const parsersConfig = await loadConfig(configPath);
    allParsersConfig.push(...parsersConfig);
  }
  
  const parsers = allParsersConfig.map((cfg) => {
    const Engine = engines[cfg.engine] ?? engines.jsdom;
    return new Engine(cfg);
  });

  const newCodes = await searchCodes(db, parsers);

  if (newCodes.length) {
    await postCodes(newCodes);
  }

  logger.info("Finished");
}

await run();
