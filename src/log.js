import pino from "pino";

const { NODE_ENV } = process.env;

const settings = {};

if (NODE_ENV === "development") {
  settings.transport = { target: "pino-pretty" };
}

export const logger = pino(settings);
