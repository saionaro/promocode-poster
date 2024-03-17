import "./config.js";
import { postNotification } from "./msg.js";
import { logger } from "./log.js";

const { NODE_ENV, TELEGRAM_CHANNEL_ID, PARSERS_CONFIG_PATH } = process.env;

logger.info('Cron task set up completed');

await postNotification([
  `🚀 *Promocodes Poster* initialized with following params:\n `,
  `Env: *${NODE_ENV}*`,
  `Channel ID: *${TELEGRAM_CHANNEL_ID}*`,
  `Parser: *${PARSERS_CONFIG_PATH}*`,
].join('\n'));

if (NODE_ENV === "development") {
  const { run } = await import('./index.js')
  await run();
}
