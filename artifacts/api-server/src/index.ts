import { config } from "dotenv";
import { resolve } from "path";

// Load .env from the artifact root — does NOT override vars already set by Replit
config({ path: resolve(import.meta.dirname, "../.env"), override: false });

import app from "./app";
import { logger } from "./lib/logger";
import { startTelegramAdminBot } from "./lib/telegram-bot";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startTelegramAdminBot();
});
