import { resolve, join, isAbsolute } from "path";
import fs from "fs/promises";
import { logger } from "./log.js";
import { getDirname } from "./dirname.js";

export function parseJson(maybeJson) {
  try {
    const res = JSON.parse(maybeJson);
    if (Array.isArray(res)) {
      return res;
    } else {
      logger.error(`Undefined result type: [${typeof res}]`);
    }
  } catch (e) {
    logger.error(e.message);
  }
}

export function sanitize(val) {
  let res = val.replace(/\(new\!\)/gi, "").replace(/\s+/g, " ");
  res = res.trim();
  return res;
}

export function path2Absolute(providedPath) {
  let path = providedPath;
  if (!isAbsolute(path)) {
    const dirname = getDirname(import.meta.url);
    path = join(dirname, "..", path);
  }
  return resolve(path);
}

export async function exists(path) {
  try {
    await fs.stat(path);
    return true;
  } catch (e) {
    return false;
  }
}

export function getRequiredEnv(envVar) {
  const value = process.env[envVar];

  if (!value) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }

  return value;
}

export async function processConfigs(callback) {
  const { PARSERS_CONFIG_PATH } = process.env;
  const { loadConfig } = await import("./engines/index.js");

  const configPaths = PARSERS_CONFIG_PATH.split(",").map((path) => path.trim());

  for (const configPath of configPaths) {
    const config = await loadConfig(configPath);
    await callback(config, {
      botKey: getRequiredEnv(config.bot_key_env),
      channelId: getRequiredEnv(config.channel_id_env),
    });
  }
}
