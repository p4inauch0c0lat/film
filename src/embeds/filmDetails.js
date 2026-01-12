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
