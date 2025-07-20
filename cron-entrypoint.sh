#!/bin/sh
crond
node ./src/on_container_start.js
tail -f /var/log/finder-cron.log | npx pino-pretty
