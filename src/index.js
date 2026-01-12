import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GatewayIntentBits,
  StringSelectMenuBuilder
} from 'discord.js';
import { buildCatalogueEmbed } from './embeds/catalogue.js';
import { buildFilmDetailEmbed } from './embeds/filmDetails.js';
import { buildFilmListEmbed, parsePageFromFooter } from './embeds/films.js';
import { filmCategories, getFilmById, getFilmsByCategories } from './data/films.js';
import { getCatalogueStats } from './data/catalogue.js';

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error('DISCORD_TOKEN is required to start the bot.');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const FILMS_PER_PAGE = 6;

const buildCatalogueButtons = () =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('catalogue_films')
      .setLabel('Catalogue Films')
      .setStyle(ButtonStyle.Primary)
  );

const buildFilmCategoryMenu = () => {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('film_categories')
    .setPlaceholder('Choisis tes catégories de films')
    .setMinValues(1)
    .setMaxValues(filmCategories.length)
    .addOptions(
      filmCategories.map((category) => ({
        label: category,
        value: category
      }))
    );

  return new ActionRowBuilder().addComponents(menu);
};

const buildFilmPaginationRow = (page, totalPages) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('films_page_prev')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId('films_page_next')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );

const buildFilmSelectMenu = (films) => {
  if (!films.length) {
    return null;
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId('film_select')
    .setPlaceholder('Clique sur un film pour voir les détails')
    .addOptions(
      films.map((film) => ({
        label: film.title,
        value: film.id,
        emoji: film.emoji
      }))
    );

  return new ActionRowBuilder().addComponents(menu);
};

const buildFilmPagePayload = (selectedCategories, page) => {
  const films = getFilmsByCategories(selectedCategories);
  const totalPages = Math.max(1, Math.ceil(films.length / FILMS_PER_PAGE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * FILMS_PER_PAGE;
  const pagedFilms = films.slice(startIndex, startIndex + FILMS_PER_PAGE);
  const selectionRow = buildFilmSelectMenu(pagedFilms);

  return {
    embed: buildFilmListEmbed({
      films: pagedFilms,
      page: safePage,
      totalPages,
      selectedCategories
    }),
    components: [selectionRow, buildFilmPaginationRow(safePage, totalPages)].filter(Boolean)
  };
};

const getSelectedCategoriesFromEmbed = (embed) => {
  const field = embed?.fields?.find((item) => item.name === 'Catégories');
  if (!field || field.value === 'Toutes') {
    return [];
  }
  return field.value.split(',').map((value) => value.trim()).filter(Boolean);
};

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
    await message.channel.send({
      embeds: [embed],
      components: [buildCatalogueButtons()]
    });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === 'catalogue_films') {
      await interaction.reply({
        content: 'Sélectionne les catégories de films à afficher.',
        components: [buildFilmCategoryMenu()],
        ephemeral: true
      });
      return;
    }

    if (interaction.customId === 'films_page_prev' || interaction.customId === 'films_page_next') {
      const embed = interaction.message.embeds[0];
      const { page, totalPages } = parsePageFromFooter(embed.footer?.text);
      const selectedCategories = getSelectedCategoriesFromEmbed(embed);
      const nextPage = interaction.customId === 'films_page_prev' ? page - 1 : page + 1;
      const { embed: nextEmbed, components } = buildFilmPagePayload(selectedCategories, nextPage);

      await interaction.update({ embeds: [nextEmbed], components });
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'film_categories') {
    const selectedCategories = interaction.values;
    const { embed, components } = buildFilmPagePayload(selectedCategories, 1);

    await interaction.update({
      content: null,
      embeds: [embed],
      components
    });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'film_select') {
    const selectedFilmId = interaction.values[0];
    const film = getFilmById(selectedFilmId);

    if (!film) {
      await interaction.reply({
        content: 'Impossible de trouver ce film.',
        ephemeral: true
      });
      return;
    }

    const detailEmbed = buildFilmDetailEmbed(film);
    await interaction.reply({ embeds: [detailEmbed] });
  }
});

client.login(token);
