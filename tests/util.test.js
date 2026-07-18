import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolve, join } from "path";
import { fileURLToPath } from "url";
import {
  parseJson,
  sanitize,
  path2Absolute,
  exists,
  getRequiredEnv,
  processConfigs,
} from "../src/util.js";

vi.mock("../src/log.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const { logger } = await import("../src/log.js");

describe("parseJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses a JSON array", () => {
    expect(parseJson('["a", "b"]')).toEqual(["a", "b"]);
  });

  it("returns undefined for non-array JSON", () => {
    expect(parseJson('{"a":1}')).toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });

  it("returns undefined for invalid JSON", () => {
    expect(parseJson("not-json")).toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe("sanitize", () => {
  it("strips (new!) case-insensitively", () => {
    expect(sanitize("CODE (new!) bonus")).toBe("CODE bonus");
    expect(sanitize("CODE (NEW!) bonus")).toBe("CODE bonus");
  });

  it("collapses whitespace and trims", () => {
    expect(sanitize("  foo   bar  ")).toBe("foo bar");
  });
});

describe("path2Absolute", () => {
  it("resolves absolute paths", () => {
    const abs = resolve("/tmp/foo");
    expect(path2Absolute(abs)).toBe(abs);
  });

  it("resolves relative paths from project root", () => {
    const result = path2Absolute("parsers/genshin.json");
    const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
    expect(result).toBe(join(projectRoot, "parsers/genshin.json"));
  });
});

describe("exists", () => {
  it("returns true for an existing file", async () => {
    const self = fileURLToPath(import.meta.url);
    expect(await exists(self)).toBe(true);
  });

  it("returns false for a missing path", async () => {
    expect(await exists("/tmp/definitely-does-not-exist-promocode-poster-xyz")).toBe(
      false,
    );
  });
});

describe("getRequiredEnv", () => {
  const key = "TEST_REQUIRED_ENV_VAR_XYZ";

  afterEach(() => {
    delete process.env[key];
  });

  it("returns the env value when set", () => {
    process.env[key] = "secret";
    expect(getRequiredEnv(key)).toBe("secret");
  });

  it("throws when env var is missing", () => {
    delete process.env[key];
    expect(() => getRequiredEnv(key)).toThrow(
      `Missing required environment variable: ${key}`,
    );
  });

  it("throws when env var is empty string", () => {
    process.env[key] = "";
    expect(() => getRequiredEnv(key)).toThrow(
      `Missing required environment variable: ${key}`,
    );
  });
});

describe("processConfigs", () => {
  const originalParsersPath = process.env.PARSERS_CONFIG_PATH;
  const originalBot = process.env.TEST_BOT_KEY;
  const originalChannel = process.env.TEST_CHANNEL_ID;
  const originalBot2 = process.env.TEST_BOT_KEY_2;
  const originalChannel2 = process.env.TEST_CHANNEL_ID_2;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEST_BOT_KEY = "bot-1";
    process.env.TEST_CHANNEL_ID = "chan-1";
    process.env.TEST_BOT_KEY_2 = "bot-2";
    process.env.TEST_CHANNEL_ID_2 = "chan-2";
  });

  afterEach(() => {
    if (originalParsersPath === undefined) delete process.env.PARSERS_CONFIG_PATH;
    else process.env.PARSERS_CONFIG_PATH = originalParsersPath;
    if (originalBot === undefined) delete process.env.TEST_BOT_KEY;
    else process.env.TEST_BOT_KEY = originalBot;
    if (originalChannel === undefined) delete process.env.TEST_CHANNEL_ID;
    else process.env.TEST_CHANNEL_ID = originalChannel;
    if (originalBot2 === undefined) delete process.env.TEST_BOT_KEY_2;
    else process.env.TEST_BOT_KEY_2 = originalBot2;
    if (originalChannel2 === undefined) delete process.env.TEST_CHANNEL_ID_2;
    else process.env.TEST_CHANNEL_ID_2 = originalChannel2;
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("loads each config path and invokes callback with credentials", async () => {
    process.env.PARSERS_CONFIG_PATH = "cfg-a.json, cfg-b.json";

    const loadConfig = vi
      .fn()
      .mockResolvedValueOnce({
        game: "a",
        bot_key_env: "TEST_BOT_KEY",
        channel_id_env: "TEST_CHANNEL_ID",
      })
      .mockResolvedValueOnce({
        game: "b",
        bot_key_env: "TEST_BOT_KEY_2",
        channel_id_env: "TEST_CHANNEL_ID_2",
      });

    vi.doMock("../src/engines/index.js", () => ({
      loadConfig,
      default: { jsdom: class {} },
    }));

    const { processConfigs: processConfigsFresh } = await import("../src/util.js");
    const callback = vi.fn().mockResolvedValue(undefined);

    await processConfigsFresh(callback);

    expect(loadConfig).toHaveBeenCalledTimes(2);
    expect(loadConfig).toHaveBeenNthCalledWith(1, "cfg-a.json");
    expect(loadConfig).toHaveBeenNthCalledWith(2, "cfg-b.json");
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ game: "a" }),
      { botKey: "bot-1", channelId: "chan-1" },
    );
    expect(callback).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ game: "b" }),
      { botKey: "bot-2", channelId: "chan-2" },
    );
  });
});
