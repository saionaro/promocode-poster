import pino from "pino";

const { NODE_ENV } = process.env;

const settings = {
  msgPrefix: `[env:${NODE_ENV == "development" ? "dev" : "prod"}] `,
};

if (NODE_ENV === "development") {
  settings.transport = { target: "pino-pretty" };
}

export const logger = pino(settings);
