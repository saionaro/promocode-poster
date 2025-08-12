import { dirname } from "path";
import { fileURLToPath } from "url";

export function getDirname(fileUrl) {
  const __filename = fileURLToPath(fileUrl);
  return dirname(__filename);
}
