import "./config.js";
import { postNotification } from "./msg.js";
import { logger } from "./log.js";
import { processConfigs } from "./util.js";

const { NODE_ENV } = process.env;

logger.info("Cron task set up completed");

await processConfigs(async (config, botKey) => {
  await postNotification(
    [
      `🚀 *Promocodes Poster* initialized with following params:\n `,
      `Game: *${config.game}*`,
      `Env: *${NODE_ENV}*`,
      `Channel ID: *${config.channel_id}*`,
    ].join("\n"),
    botKey
  );
});

if (NODE_ENV === "development") {
  const { run } = await import("./index.js");
  
  await processConfigs(run);
}
