import FormData from "form-data";
import axios from "axios";
import { logger } from "./log.js";

const {
  TELEGRAM_BOT_KEY,
  TELEGRAM_CHANNEL_ID,
  NODE_ENV,
  REDEEM_URL,
 } = process.env;
const SIGNATURE = `\n--\n[How to redeem a code](${REDEEM_URL})`;

export async function postMessage(text) {
  logger.info(`Sending message to [${TELEGRAM_CHANNEL_ID}] [${NODE_ENV}]`);
  let form = new FormData();
  form.append("chat_id", TELEGRAM_CHANNEL_ID);
  form.append("text", `${text}${SIGNATURE}`);
  form.append("parse_mode", "markdown");
  form.append("disable_web_page_preview", "true");
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_KEY}/sendMessage`,
      form
    );
    logger.info("Message sent");
  } catch (e) {
    logger.error("Message is NOT sent");
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
  await postMessage(message);
}
