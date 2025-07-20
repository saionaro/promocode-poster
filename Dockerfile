FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY start-cron /etc/cron.d/start-cron
COPY cron-entrypoint.sh /cron-entrypoint.sh
RUN chmod 0644 /etc/cron.d/start-cron \
  && touch /var/log/finder-cron.log \
  && crontab /etc/cron.d/start-cron \
  && chmod +x /cron-entrypoint.sh

COPY . .

ENTRYPOINT ["/cron-entrypoint.sh"]
