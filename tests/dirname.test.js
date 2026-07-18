import { describe, it, expect } from "vitest";
import { dirname } from "path";
import { pathToFileURL } from "url";
import { getDirname } from "../src/dirname.js";

describe("getDirname", () => {
  it("returns the directory of a file URL", () => {
    const filePath = "/Users/example/project/src/index.js";
    const fileUrl = pathToFileURL(filePath).href;
    expect(getDirname(fileUrl)).toBe(dirname(filePath));
  });

  it("works with nested paths", () => {
    const filePath = "/tmp/a/b/c/module.js";
    const fileUrl = pathToFileURL(filePath).href;
    expect(getDirname(fileUrl)).toBe("/tmp/a/b/c");
  });
});
