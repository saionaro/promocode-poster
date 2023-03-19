import "./config.js";
import { sources } from "./sources.js";
import { postMessage } from "./msg.js";
import { DB } from "./db.js";
import { logger } from "./log.js";

const { DB_DIR } = process.env;

const formatMessage = (promocode) => {
  let res = `\`${promocode.code.toUpperCase()}\``;
  res += "\n";
  res += `Content: ${promocode.description}`;
  res += "\n";
  return res;
};

async function postCodes(codes) {
  let message = "";

  for (const code of codes) {
    message += `\n${formatMessage(code)}`;
  }

  await postMessage(message);
}

async function searchCodes(db) {
  logger.info("Start codes search");
  const foundCodes = [];
  const worker = await db.createWorker();

  for (const SourceClass of sources) {
    const source = await new SourceClass().init();
    const codes = await source.getCodes();
    await source.destroy();

    for (const code of codes) {
      if (!worker.has(code.code)) {
        worker.add(code.code, code.description);
        foundCodes.push(code);
      }
    }
  }

  await db.terminateWorker();

  if (foundCodes.length) {
    logger.info(`Found new codes: ${foundCodes.length}`);
  } else {
    logger.info("No new codes found");
  }

  return foundCodes;
}

async function run() {
  logger.info("Started");
  const db = new DB(DB_DIR);
  await db.init();

  const new_codes = await searchCodes(db);

  if (new_codes.length) {
    await postCodes(new_codes);
  }
}

await run();
