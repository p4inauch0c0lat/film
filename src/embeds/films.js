import { EmbedBuilder } from 'discord.js';

const pageFooter = (page, totalPages) => `Page ${page}/${totalPages}`;

export const buildFilmListEmbed = ({
  films,
  page,
  totalPages,
  selectedCategories
}) => {
  const description = films.length
    ? films.map((film) => `${film.emoji} **${film.title}**`).join('\n')
    : 'Aucun film ne correspond à ces catégories.';

  return new EmbedBuilder()
    .setTitle('Catalogue Films')
    .setDescription(description)
    .addFields({
      name: 'Catégories',
      value: selectedCategories.length ? selectedCategories.join(', ') : 'Toutes'
    })
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
