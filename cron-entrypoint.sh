crond
node ./src/on_container_start.js
tail -f /var/log/finder-cron.log | pino-pretty
