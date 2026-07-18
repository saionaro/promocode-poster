import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fetchMock = vi.fn();

vi.mock("node-fetch", () => ({
  default: fetchMock,
}));

vi.mock("../src/log.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const { postCodes, postNotification } = await import("../src/msg.js");
const { logger } = await import("../src/log.js");

function okResponse() {
  return { status: 200 };
}

describe("msg", () => {
  const originalAdminId = process.env.TELEGRAM_CHANNEL_ADMIN_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue(okResponse());
  });

  afterEach(() => {
    if (originalAdminId === undefined) {
      delete process.env.TELEGRAM_CHANNEL_ADMIN_ID;
    } else {
      process.env.TELEGRAM_CHANNEL_ADMIN_ID = originalAdminId;
    }
  });

  describe("postCodes", () => {
    it("posts a markdown message with codes and redeem signature", async () => {
      const codes = [
        {
          code: "abc123",
          description: "60 Primogems",
          source: "https://example.com/page",
          sourceName: "Example",
        },
      ];
      const gameConfig = {
        redeem_url: "https://game.example/redeem",
      };

      await postCodes(codes, gameConfig, {
        channelId: "-1001",
        botKey: "BOTTOKEN",
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.telegram.org/botBOTTOKEN/sendMessage");
      expect(options.method).toBe("POST");
      expect(options.body).toBeInstanceOf(FormData);
      expect(options.body.get("chat_id")).toBe("-1001");
      expect(options.body.get("parse_mode")).toBe("markdown");
      expect(options.body.get("disable_web_page_preview")).toBe("true");

      const text = options.body.get("text");
      expect(text).toContain("`ABC123`");
      expect(text).toContain("60 Primogems");
      expect(text).toContain("[Example](https://example.com/page)");
      expect(text).toContain("[Redeem a code](https://game.example/redeem)");
    });

    it("includes multiple codes in one message", async () => {
      await postCodes(
        [
          {
            code: "one",
            description: "d1",
            source: "https://s/1",
            sourceName: "S1",
          },
          {
            code: "two",
            description: "d2",
            source: "https://s/2",
            sourceName: "S2",
          },
        ],
        { redeem_url: "https://r" },
        { channelId: "c", botKey: "k" },
      );

      const text = fetchMock.mock.calls[0][1].body.get("text");
      expect(text).toContain("`ONE`");
      expect(text).toContain("`TWO`");
    });

    it("does not throw when Telegram returns non-200", async () => {
      fetchMock.mockResolvedValue({ status: 400 });

      await expect(
        postCodes(
          [
            {
              code: "x",
              description: "d",
              source: "https://s",
              sourceName: "S",
            },
          ],
          { redeem_url: "https://r" },
          { channelId: "c", botKey: "k" },
        ),
      ).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalled();
    });

    it("does not throw when fetch rejects", async () => {
      fetchMock.mockRejectedValue(new Error("network down"));

      await expect(
        postCodes(
          [
            {
              code: "x",
              description: "d",
              source: "https://s",
              sourceName: "S",
            },
          ],
          { redeem_url: "https://r" },
          { channelId: "c", botKey: "k" },
        ),
      ).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("postNotification", () => {
    it("skips sending when TELEGRAM_CHANNEL_ADMIN_ID is unset", async () => {
      delete process.env.TELEGRAM_CHANNEL_ADMIN_ID;

      // Re-import is not needed: module reads env at call time for the check
      // but TELEGRAM_CHANNEL_ADMIN_ID is captured at module load. Force dynamic import.
      vi.resetModules();
      vi.doMock("node-fetch", () => ({ default: fetchMock }));
      vi.doMock("../src/log.js", () => ({
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
        },
      }));
      const { postNotification: postNotificationFresh } = await import(
        "../src/msg.js"
      );
      const { logger: loggerFresh } = await import("../src/log.js");

      await postNotificationFresh("hello", "BOT");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(loggerFresh.info).toHaveBeenCalledWith(
        expect.stringContaining("No TELEGRAM_CHANNEL_ADMIN_ID"),
      );
    });

    it("sends to admin id when set", async () => {
      process.env.TELEGRAM_CHANNEL_ADMIN_ID = "admin-99";
      vi.resetModules();
      vi.doMock("node-fetch", () => ({ default: fetchMock }));
      vi.doMock("../src/log.js", () => ({
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
        },
      }));
      const { postNotification: postNotificationFresh } = await import(
        "../src/msg.js"
      );

      await postNotificationFresh("boot complete", "BOTKEY");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.telegram.org/botBOTKEY/sendMessage");
      expect(options.body.get("chat_id")).toBe("admin-99");
      expect(options.body.get("text")).toBe("boot complete");
    });
  });
});
