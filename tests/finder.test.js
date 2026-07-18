import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/log.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const { searchCodes } = await import("../src/finder.js");
const { logger } = await import("../src/log.js");

function createFakeDb(existing = new Set()) {
  const pending = new Map();
  const worker = {
    has: vi.fn((code) => {
      const key = code.toLowerCase().trim();
      return existing.has(key) || pending.has(key);
    }),
    add: vi.fn((code, description = "") => {
      pending.set(code.toLowerCase().trim(), { code, description });
    }),
  };
  return {
    createWorker: vi.fn(async () => worker),
    terminateWorker: vi.fn(async () => {}),
    worker,
    pending,
  };
}

function createParser(codes, { fail = false } = {}) {
  return {
    init: vi.fn(async () => {}),
    getCodes: vi.fn(async () => {
      if (fail) throw new Error("parser failed");
      return codes;
    }),
    destroy: vi.fn(async () => {}),
  };
}

describe("searchCodes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only codes not already in the DB and terminates the worker", async () => {
    const db = createFakeDb(new Set(["oldcode"]));
    const parser = createParser([
      {
        code: "OLDCODE",
        description: "already known",
        source: "https://a",
        sourceName: "A",
      },
      {
        code: "NEWCODE",
        description: "fresh",
        source: "https://a",
        sourceName: "A",
      },
    ]);

    const found = await searchCodes(db, [parser]);

    expect(found).toHaveLength(1);
    expect(found[0].code).toBe("NEWCODE");
    expect(db.worker.add).toHaveBeenCalledWith("NEWCODE", "fresh");
    expect(parser.init).toHaveBeenCalled();
    expect(parser.destroy).toHaveBeenCalled();
    expect(db.terminateWorker).toHaveBeenCalledTimes(1);
  });

  it("returns empty array when no new codes", async () => {
    const db = createFakeDb(new Set(["only"]));
    const parser = createParser([
      {
        code: "ONLY",
        description: "x",
        source: "https://a",
        sourceName: "A",
      },
    ]);

    const found = await searchCodes(db, [parser]);
    expect(found).toEqual([]);
    expect(db.worker.add).not.toHaveBeenCalled();
    expect(db.terminateWorker).toHaveBeenCalled();
  });

  it("continues after a parser error and still terminates the worker", async () => {
    const db = createFakeDb();
    const bad = createParser([], { fail: true });
    const good = createParser([
      {
        code: "GOOD1",
        description: "ok",
        source: "https://b",
        sourceName: "B",
      },
    ]);

    const found = await searchCodes(db, [bad, good]);

    expect(found).toHaveLength(1);
    expect(found[0].code).toBe("GOOD1");
    expect(logger.error).toHaveBeenCalled();
    expect(good.init).toHaveBeenCalled();
    expect(db.terminateWorker).toHaveBeenCalledTimes(1);
  });

  it("aggregates new codes from multiple parsers without duplicates in one run", async () => {
    const db = createFakeDb();
    const code = {
      code: "SHARED",
      description: "from first",
      source: "https://a",
      sourceName: "A",
    };
    const p1 = createParser([code]);
    const p2 = createParser([
      {
        code: "SHARED",
        description: "from second",
        source: "https://b",
        sourceName: "B",
      },
      {
        code: "OTHER",
        description: "unique",
        source: "https://b",
        sourceName: "B",
      },
    ]);

    const found = await searchCodes(db, [p1, p2]);

    expect(found.map((c) => c.code)).toEqual(["SHARED", "OTHER"]);
    expect(db.worker.add).toHaveBeenCalledTimes(2);
  });
});
