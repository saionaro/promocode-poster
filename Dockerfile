FROM node:20

RUN apt-get update && apt-get -y install cron libgtk-3-dev \
  libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2

WORKDIR /app

COPY start-cron /etc/cron.d/start-cron
RUN chmod 0644 /etc/cron.d/start-cron \
  && touch /var/log/finder-cron.log \
  && crontab /etc/cron.d/start-cron

COPY package.json package-lock.json ./
RUN npm ci && npm i pino-pretty -g
COPY . .

COPY cron-entrypoint.sh /cron-entrypoint.sh
RUN chmod 755 /cron-entrypoint.sh

ENTRYPOINT /cron-entrypoint.sh
