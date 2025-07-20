import fetch from "node-fetch";
import { logger } from "./log.js";

const {
  TELEGRAM_BOT_KEY,
  TELEGRAM_CHANNEL_ID,
  TELEGRAM_CHANNEL_ADMIN_ID,
  REDEEM_URL,
} = process.env;
const SIGNATURE = `\n--\n[Redeem a code](${REDEEM_URL})`;

async function postMessage(target_id, text) {
  logger.info(`Sending message to [${target_id}]`);
  let form = new FormData();
  form.append("chat_id", target_id);
  form.append("text", text);
  form.append("parse_mode", "markdown");
  form.append("disable_web_page_preview", "true");
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_KEY}/sendMessage`, {
      method: "POST",
      body: form,
    });
    logger.info(`Message to [${target_id}] sent`);
  } catch (e) {
    logger.error(`Message to [${target_id}] is NOT sent`);
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

export async function postCodes(codes) {
  let message = "";
  for (const code of codes) {
    message += `\n${formatMessage(code)}`;
  }
  await postMessage(TELEGRAM_CHANNEL_ID, `${message}${SIGNATURE}`);
}

export async function postNotification(message) {
  if (!TELEGRAM_CHANNEL_ADMIN_ID)
    return void logger.info(`No TELEGRAM_CHANNEL_ADMIN_ID set`);
  await postMessage(TELEGRAM_CHANNEL_ADMIN_ID, message);
}
