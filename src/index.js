import "./config.js";
import { sources } from "./sources.js";
import { postMessage } from "./msg.js";

const formatMessage = (promocode) => {
  let res = `\`${promocode.code}\``;
  res += "\n";
  res += `Content: ${promocode.description}`;
  res += "\n";
  return res;
};

async function run() {
  console.log("Started");
  const foundCodes = [];
  for (const Source of sources) {
    const s = new Source();
    await s.init();
    const codes = await s.getCodes();
    await s.destroy();
    foundCodes.push(...codes);
  }

  let message = "";

  for (const code of foundCodes) {
    message += `\n${formatMessage(code)}`;
  }

  await postMessage(message);
}

await run();
