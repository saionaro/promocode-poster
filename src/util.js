import { dirname, resolve, join, isAbsolute } from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { logger } from "./log.js";

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

export function getDirname(fileUrl) {
  const __filename = fileURLToPath(fileUrl);
  return dirname(__filename);
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

export function getBotKey(config) {
  const botKey = process.env[config.bot_key_env];
  if (!botKey) {
    throw new Error(`Missing required environment variable: ${config.bot_key_env}`);
  }
  return botKey;
}

export async function processConfigs(callback) {
  const { PARSERS_CONFIG_PATH } = process.env;
  const { loadConfig } = await import("./engines/index.js");
  
  const configPaths = PARSERS_CONFIG_PATH.split(',').map(path => path.trim());
  
  for (const configPath of configPaths) {
    const config = await loadConfig(configPath);
    const botKey = getBotKey(config);
    await callback(config, botKey);
  }
}
