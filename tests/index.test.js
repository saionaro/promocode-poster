import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.DB_DIR = "/tmp/test-db-dir";

const postCodes = vi.fn(async () => {});
const searchCodes = vi.fn(async () => []);
const dbInit = vi.fn(async () => {});
const dbInstances = [];

class FakeDB {
  constructor(path) {
    this.path = path;
    dbInstances.push(this);
  }
  init = dbInit;
}

class FakeJsdomEngine {
  static instances = [];
  constructor(cfg) {
    this.cfg = cfg;
    FakeJsdomEngine.instances.push(this);
  }
}

class FakeOtherEngine {
  static instances = [];
  constructor(cfg) {
    this.cfg = cfg;
    FakeOtherEngine.instances.push(this);
  }
}

vi.mock("../src/config.js", () => ({}));

vi.mock("../src/log.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../src/msg.js", () => ({
  postCodes,
  postNotification: vi.fn(),
}));

vi.mock("../src/finder.js", () => ({
  searchCodes,
}));

vi.mock("../src/db.js", () => ({
  DB: FakeDB,
}));

vi.mock("../src/engines/index.js", () => ({
  default: {
    jsdom: FakeJsdomEngine,
    other: FakeOtherEngine,
  },
  loadConfig: vi.fn(),
}));

const { run } = await import("../src/index.js");
const { logger } = await import("../src/log.js");

describe("run", () => {
  const creds = { botKey: "BOT", channelId: "CHAN" };

  beforeEach(() => {
    vi.clearAllMocks();
    dbInstances.length = 0;
    FakeJsdomEngine.instances = [];
    FakeOtherEngine.instances = [];
  });

  it("posts when new codes are found", async () => {
    const newCodes = [
      {
        code: "NEW1",
        description: "reward",
        source: "https://s",
        sourceName: "S",
      },
    ];
    searchCodes.mockResolvedValue(newCodes);

    const gameConfig = {
      game: "genshin",
      db_file: "db_genshin.json",
      redeem_url: "https://redeem",
      parsers: [
        {
          name: "Src",
          engine: "jsdom",
          source_url: "https://example.com",
          list_selectors: ["ul"],
          divider: " - ",
        },
      ],
    };

    await run(gameConfig, creds);

    expect(dbInit).toHaveBeenCalled();
    expect(dbInstances[0].path).toContain("db_genshin.json");
    expect(FakeJsdomEngine.instances).toHaveLength(1);
    expect(searchCodes).toHaveBeenCalledWith(
      expect.any(FakeDB),
      FakeJsdomEngine.instances,
    );
    expect(postCodes).toHaveBeenCalledWith(newCodes, gameConfig, creds);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Found 1 new codes"),
    );
  });

  it("does not post when no new codes", async () => {
    searchCodes.mockResolvedValue([]);

    await run(
      {
        game: "wuwa",
        db_file: "db_wuwa.json",
        parsers: [{ name: "A", engine: "jsdom" }],
      },
      creds,
    );

    expect(postCodes).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("No new codes found"),
    );
  });

  it("falls back to jsdom when engine is unknown", async () => {
    searchCodes.mockResolvedValue([]);

    await run(
      {
        game: "honkai",
        db_file: "db_honkai.json",
        parsers: [{ name: "A", engine: "unknown-engine" }],
      },
      creds,
    );

    expect(FakeJsdomEngine.instances).toHaveLength(1);
    expect(FakeOtherEngine.instances).toHaveLength(0);
  });

  it("uses a named engine when present", async () => {
    searchCodes.mockResolvedValue([]);

    await run(
      {
        game: "honkai",
        db_file: "db_honkai.json",
        parsers: [{ name: "A", engine: "other" }],
      },
      creds,
    );

    expect(FakeOtherEngine.instances).toHaveLength(1);
    expect(FakeJsdomEngine.instances).toHaveLength(0);
  });
});
