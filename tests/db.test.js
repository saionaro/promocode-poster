import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";

vi.mock("../src/log.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const { DB } = await import("../src/db.js");

describe("DB", () => {
  let tmpDir;
  let dbPath;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "promocode-db-"));
    dbPath = path.join(tmpDir, "nested", "db_test.json");
  });

  afterEach(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("init creates the database file and parent directories when missing", async () => {
    const db = new DB(dbPath);
    await db.init();

    const raw = await fs.readFile(dbPath, "utf-8");
    const content = JSON.parse(raw);
    expect(content.codes).toEqual({});
    expect(typeof content.updateTs).toBe("number");
    expect(content.updateTs).toBeGreaterThan(0);
  });

  it("init leaves existing content alone", async () => {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    const existing = {
      codes: { abc: { code: "abc", description: "keep me" } },
      updateTs: 42,
    };
    await fs.writeFile(dbPath, JSON.stringify(existing));

    const db = new DB(dbPath);
    await db.init();

    const content = await db.getContent();
    expect(content).toEqual(existing);
  });

  it("worker tracks pending codes case-insensitively and persists on terminate", async () => {
    const db = new DB(dbPath);
    await db.init();

    const worker = await db.createWorker();
    expect(worker.has("NEWCODE")).toBe(false);

    worker.add("  NewCode  ", "60 Primogems");
    expect(worker.has("newcode")).toBe(true);
    expect(worker.has("NEWCODE")).toBe(true);

    const beforeTs = (await db.getContent()).updateTs;
    await new Promise((r) => setTimeout(r, 5));
    await db.terminateWorker();

    const persisted = await db.getContent();
    expect(persisted.codes.newcode).toEqual({
      code: "newcode",
      description: "60 Primogems",
    });
    expect(persisted.updateTs).toBeGreaterThanOrEqual(beforeTs);

    const db2 = new DB(dbPath);
    await db2.init();
    const worker2 = await db2.createWorker();
    expect(worker2.has("NEWCODE")).toBe(true);
  });

  it("has returns true for codes already in file before add", async () => {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    await fs.writeFile(
      dbPath,
      JSON.stringify({
        codes: { known: { code: "known", description: "x" } },
        updateTs: 1,
      }),
    );

    const db = new DB(dbPath);
    await db.init();
    const worker = await db.createWorker();
    expect(worker.has("KNOWN")).toBe(true);
    expect(worker.has("missing")).toBe(false);
  });

  it("writes compact JSON when not in development", async () => {
    // NODE_ENV is captured at module load in db.js; default suite env is not "development"
    const db = new DB(dbPath);
    await db.init();
    const worker = await db.createWorker();
    worker.add("code1", "desc");
    await db.terminateWorker();

    const raw = await fs.readFile(dbPath, "utf-8");
    expect(raw).not.toMatch(/\n\s+"codes"/);
    expect(JSON.parse(raw).codes.code1.description).toBe("desc");
  });

  it("writes pretty JSON when NODE_ENV is development at module load", async () => {
    process.env.NODE_ENV = "development";
    vi.resetModules();
    vi.doMock("../src/log.js", () => ({
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      },
    }));
    const { DB: DevDB } = await import("../src/db.js");

    const db = new DevDB(dbPath);
    await db.init();
    const worker = await db.createWorker();
    worker.add("code1", "desc");
    await db.terminateWorker();

    const raw = await fs.readFile(dbPath, "utf-8");
    expect(raw).toContain("\n");
    expect(JSON.parse(raw).codes.code1.description).toBe("desc");
  });
});
