import { describe, it, expect, vi } from "vitest";
import { fileURLToPath } from "url";

vi.mock("../../src/log.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const engines = await import("../../src/engines/index.js");
const { BaseEngine } = await import("../../src/engines/base.js");
const { Engine } = await import("../../src/engines/jsdom.js");

describe("engines/index", () => {
  it("exports jsdom engine on the default map", () => {
    expect(engines.default.jsdom).toBe(Engine);
  });

  it("re-exports loadConfig from BaseEngine", () => {
    expect(engines.loadConfig).toBe(BaseEngine.loadConfig);
  });

  it("loadConfig can load the sample fixture", async () => {
    const fixture = fileURLToPath(
      new URL("../fixtures/sample-parser-config.json", import.meta.url),
    );
    const config = await engines.loadConfig(fixture);
    expect(config.game).toBe("testgame");
  });
});
