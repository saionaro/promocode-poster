import "./config.js";
import { postMessage } from "./msg.js";
import { loadConfig } from "./engines/index.js";
import { logger } from "./log.js";

const { NODE_ENV, PARSERS_CONFIG_PATH, TELEGRAM_CHANNEL_ADMIN_ID } = process.env;

logger.info("Cron task set up completed");

// Support comma-separated multiple config paths
const configPaths = PARSERS_CONFIG_PATH.split(',').map(path => path.trim());

// Send initialization notification with each bot
for (const configPath of configPaths) {
  const config = await loadConfig(configPath);
  const botKey = process.env[config.bot_key_env];
  
  if (botKey && TELEGRAM_CHANNEL_ADMIN_ID) {
    await postMessage(
      [
        `🚀 *Promocodes Poster* initialized with following params:\n `,
        `Game: *${config.game}*`,
        `Env: *${NODE_ENV}*`,
        `Channel ID: *${config.channel_id}*`,
        `Parser Config: *${configPath}*`,
      ].join("\n"),
      TELEGRAM_CHANNEL_ADMIN_ID,
      botKey
    );
  }
}

if (NODE_ENV === "development") {
  const { run } = await import("./index.js");
  
  // Process each config file
  for (const configPath of configPaths) {
    const config = await loadConfig(configPath);
    await run(config);
  }
}
