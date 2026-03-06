# owockibot Discord Bot

> 🤖 Discord bot for [owockibot.xyz](https://owockibot.xyz) — live and running

## 🔗 Add to your server

**[👉 Invite the bot](https://discord.com/oauth2/authorize?client_id=1479507090803523686&scope=bot+applications.commands&permissions=274877908992)**

## Commands

| Command | Description |
|---------|-------------|
| `/ratio` | Token price, 24h volume, liquidity, buy/sell txns |
| `/treasury` | Treasury balances (ETH, USDC, token) and market data |
| `/bounties` | Open bounties on the bounty board with stats |

## Setup (self-hosted)

```bash
npm install
DISCORD_TOKEN=your_token DISCORD_CLIENT_ID=your_client_id node bot.js
```

## APIs used

- `https://owockibot.xyz/api/bounty-board` — open bounties
- `https://owockibot.xyz/api/bounty-board/stats` — board stats
- `https://explorer.owockibot.xyz/api/treasury` — treasury data
- DexScreener API — live token price & volume
