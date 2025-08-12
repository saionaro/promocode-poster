import fetch from "node-fetch";
import { logger } from "./log.js";

const {
  TELEGRAM_CHANNEL_ADMIN_ID,
} = process.env;

async function postMessage(text, targetId, botKey) {
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

export async function postCodes(codes, gameConfig, botKey) {
  const SIGNATURE = `\n--\n[Redeem a code](${gameConfig.redeem_url})`;
  let message = "";
  for (const code of codes) {
    message += `\n${formatMessage(code)}`;
  }
  await postMessage(`${message}${SIGNATURE}`, gameConfig.channel_id, botKey);
}

export async function postNotification(message, botKey) {
  if (!TELEGRAM_CHANNEL_ADMIN_ID)
    return void logger.info(`No TELEGRAM_CHANNEL_ADMIN_ID set`);
  
  await postMessage(message, TELEGRAM_CHANNEL_ADMIN_ID, botKey);
}
