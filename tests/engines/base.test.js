import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

vi.mock("../../src/log.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const { BaseEngine } = await import("../../src/engines/base.js");
const { logger } = await import("../../src/log.js");

const baseMeta = {
  name: "TestSource",
  source_url: "https://example.com/codes",
  root_selector: ".body",
  list_selectors: [".codes ul"],
  divider: " - ",
};

describe("BaseEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("maps meta fields with defaults", () => {
      const engine = new BaseEngine(baseMeta);
      expect(engine.name).toBe("TestSource");
      expect(engine.url).toBe("https://example.com/codes");
      expect(engine.rootSelector).toBe(".body");
      expect(engine.listSelectors).toEqual([".codes ul"]);
      expect(engine.divider).toBe(" - ");
      expect(engine.extract).toBe("list");
      expect(engine.codeColumn).toBe(0);
      expect(engine.descriptionColumn).toBe(1);
      expect(engine.statusColumn).toBeUndefined();
      expect(engine.statusInclude).toBeNull();
      expect(engine.tableLimit).toBeNull();
      expect(engine.bytesTransferred).toBe(0);
    });

    it("accepts table-related overrides", () => {
      const engine = new BaseEngine({
        ...baseMeta,
        extract: "table",
        code_column: 1,
        description_column: 2,
        status_column: 3,
        status_include: ["Active", "Working"],
        table_limit: 2,
      });
      expect(engine.extract).toBe("table");
      expect(engine.codeColumn).toBe(1);
      expect(engine.descriptionColumn).toBe(2);
      expect(engine.statusColumn).toBe(3);
      expect(engine.statusInclude).toEqual(["Active", "Working"]);
      expect(engine.tableLimit).toBe(2);
    });
  });

  describe("parse", () => {
    it("splits list items on divider and normalizes fields", () => {
      const engine = new BaseEngine(baseMeta);
      const parsed = engine.parse([
        "genshin60 - 60 Primogems (limited)",
        "  code2 - part a - part b  ",
      ]);

      expect(parsed).toEqual([
        {
          code: "GENSHIN60",
          description: "60 Primogems limited",
          source: baseMeta.source_url,
          sourceName: "TestSource",
        },
        {
          code: "CODE2",
          description: "part a - part b",
          source: baseMeta.source_url,
          sourceName: "TestSource",
        },
      ]);
    });

    it("strips (new!) via sanitize", () => {
      const engine = new BaseEngine(baseMeta);
      const [item] = engine.parse(["PROMO (new!) - 10 gems"]);
      expect(item.code).toBe("PROMO");
      expect(item.description).toBe("10 gems");
    });
  });

  describe("parseTable", () => {
    it("uses configured columns and strips trailing parenthetical notes from codes", () => {
      const engine = new BaseEngine({
        ...baseMeta,
        extract: "table",
        code_column: 0,
        description_column: 1,
      });
      const parsed = engine.parseTable([
        ["WUWA4PC (PC only)", "50 Astrite"],
        ["plain", "100 gold"],
      ]);

      expect(parsed[0]).toEqual({
        code: "WUWA4PC",
        description: "50 Astrite",
        source: baseMeta.source_url,
        sourceName: "TestSource",
      });
      expect(parsed[1].code).toBe("PLAIN");
      expect(parsed[1].description).toBe("100 gold");
    });
  });

  describe("statusAllowed", () => {
    it("returns true when no status_include configured", () => {
      const engine = new BaseEngine(baseMeta);
      expect(engine.statusAllowed("Expired")).toBe(true);
      expect(engine.statusAllowed("")).toBe(true);
    });

    it("matches include tokens case-insensitively", () => {
      const engine = new BaseEngine({
        ...baseMeta,
        status_include: ["Active", "Working"],
      });
      expect(engine.statusAllowed("ACTIVE")).toBe(true);
      expect(engine.statusAllowed("still working")).toBe(true);
      expect(engine.statusAllowed("Expired")).toBe(false);
    });
  });

  describe("filter", () => {
    const engine = new BaseEngine(baseMeta);

    const record = (code, description = "reward") => ({
      code,
      description,
      source: "https://x",
      sourceName: "X",
    });

    it("keeps valid codes", () => {
      expect(engine.filter([record("VALIDCODE")])).toHaveLength(1);
    });

    it("drops codes longer than 15 characters", () => {
      expect(engine.filter([record("ABCDEFGHIJKLMNOP")])).toHaveLength(0);
    });

    it("drops codes with denied symbols", () => {
      for (const sym of ["!", "#", "@", ":", " "]) {
        expect(engine.filter([record(`BAD${sym}X`)])).toHaveLength(0);
      }
    });

    it("drops records without description", () => {
      expect(engine.filter([record("OKCODE", "")])).toHaveLength(0);
    });
  });

  describe("abstract methods", () => {
    it("init, getPage, getCodes throw when not implemented", async () => {
      const engine = new BaseEngine(baseMeta);
      await expect(engine.init()).rejects.toThrow(/init method/);
      await expect(engine.getPage()).rejects.toThrow(/getPage method/);
      await expect(engine.getCodes()).rejects.toThrow(/getPage method/);
    });
  });

  describe("destroy", () => {
    it("logs network usage", async () => {
      const engine = new BaseEngine(baseMeta);
      engine.bytesTransferred = 2048;
      await engine.destroy();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Network usage"),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("TestSource"),
      );
    });
  });

  describe("loadConfig", () => {
    let exitSpy;
    let tmpDir;

    beforeEach(() => {
      exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`process.exit:${code}`);
      });
    });

    afterEach(async () => {
      exitSpy.mockRestore();
      if (tmpDir) {
        await fs.rm(tmpDir, { recursive: true, force: true });
        tmpDir = undefined;
      }
    });

    it("loads a valid config file", async () => {
      const fixture = fileURLToPath(
        new URL("../fixtures/sample-parser-config.json", import.meta.url),
      );
      const config = await BaseEngine.loadConfig(fixture);
      expect(config.game).toBe("testgame");
      expect(config.parsers).toHaveLength(1);
      expect(config.parsers[0].name).toBe("TestSource");
    });

    it("exits when config path is missing", async () => {
      await expect(
        BaseEngine.loadConfig("/tmp/missing-config-promocode-xyz.json"),
      ).rejects.toThrow("process.exit:1");
      expect(logger.error).toHaveBeenCalled();
    });

    it("exits when config JSON is invalid", async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cfg-"));
      const badPath = path.join(tmpDir, "bad.json");
      await fs.writeFile(badPath, "{ not valid json");

      await expect(BaseEngine.loadConfig(badPath)).rejects.toThrow(
        "process.exit:1",
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
