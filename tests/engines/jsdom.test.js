import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";

const fetchMock = vi.fn();

vi.mock("node-fetch", () => ({
  default: fetchMock,
}));

vi.mock("../../src/log.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const { Engine } = await import("../../src/engines/jsdom.js");

const listFixturePath = fileURLToPath(
  new URL("../fixtures/list-page.html", import.meta.url),
);
const tableFixturePath = fileURLToPath(
  new URL("../fixtures/table-page.html", import.meta.url),
);

function blobResponse(text, size) {
  const bytes = Buffer.byteLength(text, "utf-8");
  return {
    blob: async () => ({
      size: size ?? bytes,
      text: async () => text,
    }),
  };
}

describe("jsdom Engine", () => {
  let exitSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit:${code}`);
    });
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  describe("init", () => {
    it("returns the engine instance", async () => {
      const engine = new Engine({
        name: "ListSrc",
        source_url: "https://example.com/list",
        root_selector: ".article-body",
        list_selectors: [".codes-list"],
        divider: " - ",
      });
      await expect(engine.init()).resolves.toBe(engine);
    });
  });

  describe("getPage", () => {
    it("fetches URL, tracks bytes, and returns text", async () => {
      const html = "<html></html>";
      fetchMock.mockResolvedValue(blobResponse(html, 123));

      const engine = new Engine({
        name: "ListSrc",
        source_url: "https://example.com/list",
        root_selector: ".article-body",
        list_selectors: [".codes-list"],
        divider: " - ",
      });

      const text = await engine.getPage();
      expect(text).toBe(html);
      expect(engine.bytesTransferred).toBe(123);
      expect(fetchMock).toHaveBeenCalledWith("https://example.com/list");
    });

    it("exits process when fetch fails", async () => {
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
      const engine = new Engine({
        name: "ListSrc",
        source_url: "https://example.com/list",
        root_selector: ".article-body",
        list_selectors: [".codes-list"],
        divider: " - ",
      });

      await expect(engine.getPage()).rejects.toThrow("process.exit:1");
    });
  });

  describe("list extraction", () => {
    it("extracts and filters codes from list HTML", async () => {
      const html = await fs.readFile(listFixturePath, "utf-8");
      fetchMock.mockResolvedValue(blobResponse(html));

      const engine = new Engine({
        name: "ListSrc",
        source_url: "https://example.com/list",
        root_selector: ".article-body",
        list_selectors: [".codes-list"],
        divider: " - ",
      });

      const codes = await engine.getCodes();
      const codeValues = codes.map((c) => c.code);

      expect(codeValues).toContain("GENSHIN60");
      expect(codeValues).toContain("PRIMOGEMS30");
      expect(codeValues).not.toContain("INVALIDCODEWITHEXTRALONGNAME");
      expect(codeValues.some((c) => c.includes(" "))).toBe(false);

      const genshin = codes.find((c) => c.code === "GENSHIN60");
      expect(genshin.description).toBe("60 Primogems");
      expect(genshin.sourceName).toBe("ListSrc");
      expect(genshin.source).toBe("https://example.com/list");
    });

    it("extractListItems reads children text from matched lists", () => {
      const engine = new Engine({
        name: "ListSrc",
        source_url: "https://example.com/list",
        root_selector: ".article-body",
        list_selectors: [".codes-list"],
        divider: " - ",
      });
      const html = `<ul class="codes-list"><li>A - 1</li><li>B - 2</li></ul>`;
      const { document } = new JSDOM(html).window;
      expect(engine.extractListItems(document)).toEqual(["A - 1", "B - 2"]);
    });
  });

  describe("table extraction", () => {
    it("skips headers, filters by status, and respects table_limit", async () => {
      const html = await fs.readFile(tableFixturePath, "utf-8");
      fetchMock.mockResolvedValue(blobResponse(html));

      const engine = new Engine({
        name: "TableSrc",
        source_url: "https://example.com/table",
        root_selector: ".entry-content",
        list_selectors: [".codes-table"],
        divider: " - ",
        extract: "table",
        code_column: 0,
        description_column: 1,
        status_column: 2,
        status_include: ["Active", "Working"],
        table_limit: 1,
      });

      const codes = await engine.getCodes();
      const codeValues = codes.map((c) => c.code);

      expect(codeValues).toContain("WUWA4PC");
      expect(codeValues).toContain("VALIDCODE");
      expect(codeValues).not.toContain("EXPIRED99");
      expect(codeValues).not.toContain("SECONDTABLE");
      expect(codeValues).not.toContain("CODE");

      const wuwa = codes.find((c) => c.code === "WUWA4PC");
      expect(wuwa.description).toBe("50 Astrite");
    });

    it("isHeaderRow detects common header labels", () => {
      const engine = new Engine({
        name: "TableSrc",
        source_url: "https://example.com/table",
        root_selector: ".entry-content",
        list_selectors: [".codes-table"],
        divider: " - ",
        extract: "table",
      });

      expect(engine.isHeaderRow(null, ["Code", "Rewards"])).toBe(true);
      expect(engine.isHeaderRow(null, ["codes", "x"])).toBe(true);
      expect(engine.isHeaderRow(null, ["Reward", "x"])).toBe(true);
      expect(engine.isHeaderRow(null, ["Status", "x"])).toBe(true);
      expect(engine.isHeaderRow(null, ["WUWA codes", "x"])).toBe(true);
      expect(engine.isHeaderRow(null, ["HSR codes list", "x"])).toBe(true);
      expect(engine.isHeaderRow(null, ["VALIDCODE", "50 gems"])).toBe(false);
    });
  });
});
