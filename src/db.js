import fs from "fs/promises";
import { join } from "path";
import { logger } from "./log.js";
import { path2Absolute, exists } from "./util.js";

const DB_NAME = "db.json";
const ENCODING = "utf-8";

const DEFAULT_STRUCTURE = {
  codes: {},
  updateTs: 0,
};

async function createDb(path) {
  await fs.mkdir(path, { recursive: true });
  const dbPath = join(path, DB_NAME);
  const draft = {
    ...DEFAULT_STRUCTURE,
  };
  draft.updateTs = Date.now();
  await fs.writeFile(dbPath, JSON.stringify(draft));
}

const makeupCode = (raw_code) => raw_code.toLowerCase().trim();

class Worker {
  #db;
  #content = null;
  #pendingCodes = {};
  constructor(db) {
    this.#db = db;
  }
  async init() {
    this.#content = await this.#db.getContent();
  }
  has(raw_code) {
    const code = makeupCode(raw_code);
    return Boolean(this.#content.codes[code] || this.#pendingCodes[code]);
  }
  add(raw_code, description = "") {
    const code = makeupCode(raw_code);
    this.#pendingCodes[code] = { code, description };
  }
  getSnapshot() {
    return {
      ...this.#content,
      codes: {
        ...this.#content.codes,
        ...this.#pendingCodes,
      },
    };
  }
}

export class DB {
  #dbDirPath;
  #dbPath;
  #activeWorker = null;
  constructor(rawPath) {
    this.#dbDirPath = path2Absolute(rawPath);
    this.#dbPath = join(this.#dbDirPath, DB_NAME);
  }

  async init() {
    if (!(await exists(this.#dbPath))) {
      await createDb(this.#dbDirPath);
    }
    logger.info("DB inited");
  }
  async createWorker() {
    this.#activeWorker = new Worker(this);
    await this.#activeWorker.init();
    return this.#activeWorker;
  }
  async terminateWorker() {
    const new_content = this.#activeWorker.getSnapshot();
    new_content.updateTs = Date.now();
    await this.#saveContent(new_content);
    this.#activeWorker = null;
  }
  async getContent() {
    const content = await fs.readFile(this.#dbPath, ENCODING);
    return JSON.parse(content);
  }
  async #saveContent(data) {
    try {
      await fs.writeFile(this.#dbPath, JSON.stringify(data));
      return true;
    } catch (e) {
      logger.error(e);
      return false;
    }
  }
}
