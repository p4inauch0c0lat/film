import { Client, GatewayIntentBits } from 'discord.js';
import { buildCatalogueEmbed } from './embeds/catalogue.js';
import { getCatalogueStats } from './data/catalogue.js';

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error('DISCORD_TOKEN is required to start the bot.');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) {
    return;
  }

  if (message.content.trim().toLowerCase() === '!catalogue') {
    const stats = getCatalogueStats();
    const embed = buildCatalogueEmbed(stats);
    await message.channel.send({ embeds: [embed] });
  }
});

client.login(token);
