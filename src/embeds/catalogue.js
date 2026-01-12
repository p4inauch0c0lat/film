import { EmbedBuilder } from 'discord.js';

const numberFormatter = new Intl.NumberFormat('fr-FR');

const formatNumber = (value) => numberFormatter.format(value ?? 0);

export const buildCatalogueEmbed = ({
  filmCount = 0,
  seriesCount = 0,
  seasonsCount = 0,
  episodesCount = 0,
  totalLinks = 0,
  statusUrl = 'https://example.com/status'
} = {}) => {
  const description = [
    '🎬 **Catalogue Films**',
    `Notre catalogue films contient actuellement **${formatNumber(filmCount)} films**`,
    '',
    '🍿 **Catalogue Séries**',
    `Notre catalogue séries contient actuellement **${formatNumber(seriesCount)} séries**`,
    '',
    '📈 **Statistiques en chiffres**',
    `📺 **${formatNumber(seasonsCount)} saisons**, **${formatNumber(episodesCount)} épisodes** uniques!`,
    '',
    `🔗 On a un total de **${formatNumber(totalLinks)} liens**!`,
    '',
    '🌐 **Statut du serveur**',
    `[Voir le statut](${statusUrl})`
  ].join('\n');

  return new EmbedBuilder()
    .setAuthor({ name: 'Movie Mania' })
    .setTitle('Catalogue')
    .setDescription(description)
    .setColor(0x2b2d31)
    .setFooter({ text: 'Movie Mania' })
    .setTimestamp();
};
