import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = dotenv.config({
  path: resolve(__dirname, "../.env"),
});

if (result.error) {
  throw result.error;
}
