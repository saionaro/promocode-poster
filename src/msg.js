import axios from "axios";
import FormData from "form-data";

const { TELEGRAM_BOT_KEY, TELEGRAM_CHANNEL_ID, NODE_ENV } = process.env;
const REDEEM_URL = "https://genshin.hoyoverse.com/en/gift";

const SIGNATURE = `\n--\n[How to redeem a code](${REDEEM_URL})`;

export async function postMessage(text) {
  console.log(`Sending message to [${TELEGRAM_CHANNEL_ID}] [${NODE_ENV}]`);
  let form = new FormData();
  form.append("chat_id", TELEGRAM_CHANNEL_ID);
  form.append("text", `${text}${SIGNATURE}`);
  form.append("parse_mode", "markdown");
  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_KEY}/sendMessage`,
      form
    );
    // console.log(res.data.result);
    console.log("Message sent");
  } catch (e) {
    console.log("Message is NOT sent");
    console.error(e.response.data.description);
  }
}
