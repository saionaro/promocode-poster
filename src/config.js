import dotenv from "dotenv";
import { resolve } from "path";
import { getDirname } from "./util.js";

const __dirname = getDirname(import.meta.url);

const result = dotenv.config({
  path: resolve(__dirname, "../.env"),
});

if (result.error) {
  throw result.error;
}
