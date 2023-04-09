# Genshin Promocodes
---
## Development

Run a developer server locally:

1. Clone the repo
1. `cp .env.example .env` and feed secrets
1. `npm i`
1. `npm run dev`

Example crontab row - run script every 6 hours and save logs

```
0 */6 * * * node /home/ubuntu/genshin-promocodes/src/index.js >> /home/ubuntu/genshin-promocodes/logs/log 2>&1
```
