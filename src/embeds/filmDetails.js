import { EmbedBuilder } from 'discord.js';

export const buildFilmDetailEmbed = (film) =>
  new EmbedBuilder()
    .setTitle(film.title)
    .setURL(film.url)
    .setDescription(film.summary)
    .addFields(
      { name: 'Titre', value: film.title, inline: true },
      { name: 'Date de sortie', value: film.releaseDate, inline: true },
      { name: 'Lien', value: `[Accéder à ${film.title}](${film.url})` }
    )
    .setThumbnail(film.image)
    .setColor(0x2b2d31)
    .setFooter({ text: 'Movie Mania' });

export const buildSeasonDetailEmbed = (item) =>
  new EmbedBuilder()
    .setTitle(`${item.title} — Saison ${item.season}`)
    .setURL(item.url)
    .setDescription(item.summary)
    .addFields(
      { name: 'Titre', value: item.title, inline: true },
      { name: 'Saison', value: `Saison ${item.season}`, inline: true },
      { name: 'Date de sortie', value: item.releaseDate, inline: true },
      { name: 'Catégories', value: item.categories?.join(', ') || '—' },
      { name: 'Lien', value: `[Accéder à ${item.title}](${item.url})` }
    )
    .setThumbnail(item.image)
    .setColor(0x2b2d31)
    .setFooter({ text: 'Movie Mania' });
