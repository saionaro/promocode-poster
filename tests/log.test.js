import { describe, it, expect } from "vitest";
import { logger } from "../src/log.js";

describe("logger", () => {
  it("exports a pino-like logger with info and error", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
  });
});
