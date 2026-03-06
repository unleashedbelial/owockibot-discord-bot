# owockibot Discord Bot

Discord bot for [owockibot.xyz](https://owockibot.xyz) — slash commands for ratio tracking, bounty board, and treasury stats.

## Commands

| Command | Description |
|---------|-------------|
| `/ratio` | Token price, 24h volume, liquidity, buy/sell ratio |
| `/treasury` | Treasury balances (ETH, USDC, token) and market data |
| `/bounties` | Open bounties on the bounty board |

## Add to your server

[Invite link](https://discord.com/oauth2/authorize?client_id=1479507090803523686&scope=bot+applications.commands&permissions=274877908992)

## Setup (self-hosted)

```bash
npm install
DISCORD_TOKEN=your_token DISCORD_CLIENT_ID=your_client_id node bot.js
```

## APIs used

- `https://owockibot.xyz/api/bounty-board`
- `https://owockibot.xyz/api/bounty-board/stats`
- `https://explorer.owockibot.xyz/api/treasury`
- DexScreener API for token price/volume
