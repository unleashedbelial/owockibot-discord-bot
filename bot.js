import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID env vars');
  process.exit(1);
}

// ── API helpers ──────────────────────────────────────────────────────────────

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
  return r.json();
}

async function getRatioData() {
  // Owockibot ratio via DexScreener
  const data = await fetchJSON(
    'https://api.dexscreener.com/latest/dex/tokens/0xfdc933ff4e2980d18becf48e4e030d8463a2bb07'
  );
  const pair = data.pairs?.[0];
  if (!pair) throw new Error('No pair data');
  return {
    price: pair.priceUsd,
    priceNative: pair.priceNative,
    change1h: pair.priceChange?.h1 ?? 'N/A',
    change24h: pair.priceChange?.h24 ?? 'N/A',
    volume24h: pair.volume?.h24,
    liquidity: pair.liquidity?.usd,
    marketCap: pair.marketCap,
    buys24h: pair.txns?.h24?.buys ?? 0,
    sells24h: pair.txns?.h24?.sells ?? 0,
    dexUrl: pair.url,
  };
}

async function getTreasuryData() {
  return fetchJSON('https://explorer.owockibot.xyz/api/treasury');
}

async function getBountyData() {
  const [bounties, stats] = await Promise.all([
    fetchJSON('https://owockibot.xyz/api/bounty-board'),
    fetchJSON('https://owockibot.xyz/api/bounty-board/stats'),
  ]);
  return { bounties, stats };
}

// ── Embeds ───────────────────────────────────────────────────────────────────

function ratioEmbed(d) {
  const sign = (v) => (v > 0 ? `+${v}` : `${v}`);
  const fmt = (n) => (n == null ? 'N/A' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }));

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📊 owockibot — Token Ratio')
    .setURL('https://owockibot.xyz')
    .addFields(
      { name: '💵 Price', value: `$${d.price}`, inline: true },
      { name: '1h Change', value: `${sign(d.change1h)}%`, inline: true },
      { name: '24h Change', value: `${sign(d.change24h)}%`, inline: true },
      { name: '📦 Volume 24h', value: `$${fmt(d.volume24h)}`, inline: true },
      { name: '💧 Liquidity', value: `$${fmt(d.liquidity)}`, inline: true },
      { name: '📈 Market Cap', value: `$${fmt(d.marketCap)}`, inline: true },
      { name: '🟢 Buys 24h', value: `${d.buys24h}`, inline: true },
      { name: '🔴 Sells 24h', value: `${d.sells24h}`, inline: true },
    )
    .setFooter({ text: 'owockibot • Base chain' })
    .setTimestamp();
}

function treasuryEmbed(d) {
  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle('🏦 owockibot — Treasury')
    .setURL('https://explorer.owockibot.xyz')
    .addFields(
      { name: '💰 ETH', value: `${d.eth} ETH ($${d.ethUsd})`, inline: true },
      { name: '💵 USDC', value: `$${d.usdc}`, inline: true },
      { name: '🪙 Token', value: `${d.tokenBillions}B ($${d.tokenUsd})`, inline: true },
      { name: '📊 Total Value', value: `$${d.totalUsd}`, inline: true },
      { name: '💲 Token Price', value: `$${d.tokenPrice}`, inline: true },
      { name: '📈 Market Cap', value: `$${Number(d.marketCap).toLocaleString('en-US')}`, inline: true },
      { name: '🔄 Volume 24h', value: `$${Number(d.volume24h).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, inline: true },
    )
    .setFooter({ text: 'owockibot treasury' })
    .setTimestamp();
}

function bountiesEmbed(bounties, stats) {
  const open = bounties.filter(b => b.status === 'open').slice(0, 5);
  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('📋 owockibot — Bounty Board')
    .setURL('https://owockibot.xyz')
    .addFields(
      { name: '📊 Stats', value: [
        `**Open:** ${stats.open}  |  **Completed:** ${stats.completed}`,
        `**Total volume:** $${stats.total_volume_usdc} USDC`,
      ].join('\n'), inline: false },
    );

  if (open.length === 0) {
    embed.addFields({ name: '🎯 Open Bounties', value: 'No open bounties right now.', inline: false });
  } else {
    for (const b of open) {
      embed.addFields({
        name: `#${b.id} — $${b.reward_usdc} USDC`,
        value: `**${b.title}**\n${b.description.slice(0, 100)}…\n→ [owockibot.xyz/bounty](https://owockibot.xyz)`,
        inline: false,
      });
    }
  }

  return embed.setFooter({ text: `${stats.claimed} claimed • ${stats.submitted} submitted` }).setTimestamp();
}

// ── Slash commands ───────────────────────────────────────────────────────────

const commands = [
  new SlashCommandBuilder().setName('ratio').setDescription('owockibot token price & trading stats'),
  new SlashCommandBuilder().setName('treasury').setDescription('owockibot treasury balances & market data'),
  new SlashCommandBuilder().setName('bounties').setDescription('Open bounties on the owockibot bounty board'),
];

// Register commands on startup
async function registerCommands() {
  const rest = new REST().setToken(TOKEN);
  console.log('Registering slash commands...');
  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: commands.map(c => c.toJSON()),
  });
  console.log('Slash commands registered.');
}

// ── Bot ──────────────────────────────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply();

  try {
    switch (interaction.commandName) {
      case 'ratio': {
        const data = await getRatioData();
        await interaction.editReply({ embeds: [ratioEmbed(data)] });
        break;
      }
      case 'treasury': {
        const data = await getTreasuryData();
        await interaction.editReply({ embeds: [treasuryEmbed(data)] });
        break;
      }
      case 'bounties': {
        const { bounties, stats } = await getBountyData();
        await interaction.editReply({ embeds: [bountiesEmbed(bounties, stats)] });
        break;
      }
    }
  } catch (err) {
    console.error(`Error handling /${interaction.commandName}:`, err);
    await interaction.editReply({ content: `❌ Error fetching data: ${err.message}` });
  }
});

client.login(TOKEN);
