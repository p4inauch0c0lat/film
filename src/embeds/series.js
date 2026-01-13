import { EmbedBuilder } from 'discord.js';

const pageFooter = (page, totalPages) => `Page ${page}/${totalPages}`;

export const buildSeriesListEmbed = ({
  series,
  page,
  totalPages,
  selectedCategories,
  sortLabel
}) => {
  const description = series.length
    ? series.map((item) => `${item.displayEmoji ?? item.emoji} **${item.title}**`).join('\n')
    : 'Aucune série ne correspond à ces catégories.';

  return new EmbedBuilder()
    .setTitle('Catalogue Séries')
    .setDescription(description)
    .addFields(
      {
        name: 'Catégories',
        value: selectedCategories.length ? selectedCategories.join(', ') : 'Toutes'
      },
      {
        name: 'Tri',
        value: sortLabel
      }
    )
    .setColor(0x2b2d31)
    .setFooter({ text: pageFooter(page, totalPages) });
};

export const parsePageFromFooter = (footerText) => {
  const match = footerText?.match(/Page (\d+)\/(\d+)/);
  if (!match) {
    return { page: 1, totalPages: 1 };
  }
  return {
    page: Number.parseInt(match[1], 10),
    totalPages: Number.parseInt(match[2], 10)
  };
};
