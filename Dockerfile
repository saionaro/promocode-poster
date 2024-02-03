FROM node:20-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

COPY start-cron /etc/cron.d/start-cron
RUN chmod 0644 /etc/cron.d/start-cron \
  && touch /var/log/finder-cron.log \
  && crontab /etc/cron.d/start-cron

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package.json package-lock.json ./
RUN npm ci && npm i pino-pretty -g
COPY . .

COPY cron-entrypoint.sh /cron-entrypoint.sh
RUN chmod 755 /cron-entrypoint.sh

ENTRYPOINT /cron-entrypoint.sh
