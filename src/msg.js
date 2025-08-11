import fetch from "node-fetch";
import { logger } from "./log.js";

const {
  TELEGRAM_CHANNEL_ADMIN_ID,
} = process.env;

async function postMessage(botKey, targetId, text) {
  logger.info(`Sending message to [${targetId}]`);
  let form = new FormData();
  form.append("chat_id", targetId);
  form.append("text", text);
  form.append("parse_mode", "markdown");
  form.append("disable_web_page_preview", "true");
  try {
    await fetch(`https://api.telegram.org/bot${botKey}/sendMessage`, {
      method: "POST",
      body: form,
    });
    logger.info(`Message to [${targetId}] sent`);
  } catch (e) {
    logger.error(`Message to [${targetId}] is NOT sent`);
    logger.error(e.response?.data?.description);
  }
}

const formatMessage = (promocode) => {
  let res = `\`${promocode.code.toUpperCase()}\``;
  res += "\n";
  res += `${promocode.description}`;
  res += "\n";
  res += `Source: [${promocode.sourceName}](${promocode.source})`;
  res += "\n";
  return res;
};

export async function postCodes(codes, gameConfig) {
  const botKey = process.env[gameConfig.bot_key_env];
  if (!botKey) {
    logger.error(`Bot key not found in environment variable: ${gameConfig.bot_key_env}`);
    return;
  }

  const SIGNATURE = `\n--\n[Redeem a code](${gameConfig.redeem_url})`;
  let message = "";
  for (const code of codes) {
    message += `\n${formatMessage(code)}`;
  }
  await postMessage(botKey, gameConfig.channel_id, `${message}${SIGNATURE}`);
}

export async function postNotification(message) {
  if (!TELEGRAM_CHANNEL_ADMIN_ID)
    return void logger.info(`No TELEGRAM_CHANNEL_ADMIN_ID set`);
  // For notifications, we'll use the first available bot key
  // This is a fallback and should be improved if needed
  const botKeyEnvs = Object.keys(process.env).filter(key => key.startsWith('TELEGRAM_BOT_KEY_'));
  const botKey = botKeyEnvs.length > 0 ? process.env[botKeyEnvs[0]] : null;
  if (!botKey) {
    logger.error('No bot key available for admin notifications');
    return;
  }
  await postMessage(botKey, TELEGRAM_CHANNEL_ADMIN_ID, message);
}
