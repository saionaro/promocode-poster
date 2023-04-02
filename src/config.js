import dotenv from "dotenv";
import { resolve } from "path";

const result = dotenv.config({
  path: resolve(__dirname, "../.env"),
});

if (result.error) {
  throw result.error;
}
