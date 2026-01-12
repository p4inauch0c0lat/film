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
import { buildFilmListEmbed, parsePageFromFooter as parseFilmPageFromFooter } from './embeds/films.js';
import { buildAnimeListEmbed, parsePageFromFooter as parseAnimePageFromFooter } from './embeds/animes.js';
import { buildSeriesListEmbed, parsePageFromFooter as parseSeriesPageFromFooter } from './embeds/series.js';
import { filmCategories, getFilmById, getFilmsByCategories } from './data/films.js';
import { animeCategories, getAnimeById, getAnimesByCategories } from './data/animes.js';
import { seriesCategories, getSeriesById, getSeriesByCategories } from './data/series.js';
import { getCatalogueStats } from './data/catalogue.js';

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error('DISCORD_TOKEN is required to start the bot.');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const FILMS_PER_PAGE = 6;
const SERIES_PER_PAGE = 6;
const ANIMES_PER_PAGE = 6;
const SORT_OPTIONS = {
  recent: "Date d'ajout",
  alpha: 'A-Z',
  release: 'Date de sortie'
};

const buildCatalogueButtons = () =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('catalogue_films')
      .setLabel('Catalogue Films')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('catalogue_series')
      .setLabel('Catalogue Séries')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('catalogue_animes')
      .setLabel('Catalogue Animés')
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

const buildSeriesCategoryMenu = () => {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('series_categories')
    .setPlaceholder('Choisis tes catégories de séries')
    .setMinValues(1)
    .setMaxValues(seriesCategories.length)
    .addOptions(
      seriesCategories.map((category) => ({
        label: category.label,
        value: category.label,
        emoji: category.emoji
      }))
    );

  return new ActionRowBuilder().addComponents(menu);
};

const buildAnimeCategoryMenu = () => {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('anime_categories')
    .setPlaceholder('Choisis tes catégories d\'animés')
    .setMinValues(1)
    .setMaxValues(animeCategories.length)
    .addOptions(
      animeCategories.map((category) => ({
        label: category.label,
        value: category.label,
        emoji: category.emoji
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

const buildSeriesPaginationRow = (page, totalPages) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('series_page_prev')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId('series_page_next')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );

const buildAnimePaginationRow = (page, totalPages) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('animes_page_prev')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId('animes_page_next')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages)
  );

const buildItemButtonsRows = (items, prefix) => {
  if (!items.length) {
    return [];
  }

  const rows = [];
  const chunkSize = 5;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    rows.push(
      new ActionRowBuilder().addComponents(
        chunk.map((item) =>
          new ButtonBuilder()
            .setCustomId(`${prefix}:${item.id}`)
            .setEmoji(item.emoji)
            .setStyle(ButtonStyle.Secondary)
        )
      )
    );
  }

  return rows;
};

const buildSortMenu = (currentSort, customId, placeholder) => {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(
      Object.entries(SORT_OPTIONS).map(([value, label]) => ({
        label,
        value,
        default: value === currentSort
      }))
    );

  return new ActionRowBuilder().addComponents(menu);
};

const parseDate = (value) => {
  if (!value) {
    return 0;
  }
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) {
    return 0;
  }
  return new Date(year, month - 1, day).getTime();
};

const sortItems = (items, sortKey) => {
  if (sortKey === 'alpha') {
    return [...items].sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  }
  if (sortKey === 'release') {
    return [...items].sort((a, b) => parseDate(b.releaseDate) - parseDate(a.releaseDate));
  }
  return [...items].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
};

const buildFilmPagePayload = (selectedCategories, page, sortKey = 'recent') => {
  const films = sortItems(getFilmsByCategories(selectedCategories), sortKey);
  const totalPages = Math.max(1, Math.ceil(films.length / FILMS_PER_PAGE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * FILMS_PER_PAGE;
  const pagedFilms = films.slice(startIndex, startIndex + FILMS_PER_PAGE);
  const selectionRows = buildItemButtonsRows(pagedFilms, 'film_item');
  const sortRow = buildSortMenu(sortKey, 'film_sort', 'Trier par...');

  return {
    embed: buildFilmListEmbed({
      films: pagedFilms,
      page: safePage,
      totalPages,
      selectedCategories,
      sortLabel: SORT_OPTIONS[sortKey]
    }),
    components: [...selectionRows, sortRow, buildFilmPaginationRow(safePage, totalPages)].filter(
      Boolean
    )
  };
};

const buildSeriesPagePayload = (selectedCategories, page, sortKey = 'recent') => {
  const series = sortItems(getSeriesByCategories(selectedCategories), sortKey);
  const totalPages = Math.max(1, Math.ceil(series.length / SERIES_PER_PAGE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * SERIES_PER_PAGE;
  const pagedSeries = series.slice(startIndex, startIndex + SERIES_PER_PAGE);
  const selectionRows = buildItemButtonsRows(pagedSeries, 'series_item');
  const sortRow = buildSortMenu(sortKey, 'series_sort', 'Trier par...');

  return {
    embed: buildSeriesListEmbed({
      series: pagedSeries,
      page: safePage,
      totalPages,
      selectedCategories,
      sortLabel: SORT_OPTIONS[sortKey]
    }),
    components: [...selectionRows, sortRow, buildSeriesPaginationRow(safePage, totalPages)].filter(
      Boolean
    )
  };
};

const buildAnimePagePayload = (selectedCategories, page, sortKey = 'recent') => {
  const animes = sortItems(getAnimesByCategories(selectedCategories), sortKey);
  const totalPages = Math.max(1, Math.ceil(animes.length / ANIMES_PER_PAGE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * ANIMES_PER_PAGE;
  const pagedAnimes = animes.slice(startIndex, startIndex + ANIMES_PER_PAGE);
  const selectionRows = buildItemButtonsRows(pagedAnimes, 'anime_item');
  const sortRow = buildSortMenu(sortKey, 'anime_sort', 'Trier par...');

  return {
    embed: buildAnimeListEmbed({
      animes: pagedAnimes,
      page: safePage,
      totalPages,
      selectedCategories,
      sortLabel: SORT_OPTIONS[sortKey]
    }),
    components: [...selectionRows, sortRow, buildAnimePaginationRow(safePage, totalPages)].filter(
      Boolean
    )
  };
};

const getSelectedCategoriesFromEmbed = (embed) => {
  const field = embed?.fields?.find((item) => item.name === 'Catégories');
  if (!field || field.value === 'Toutes') {
    return [];
  }
  return field.value.split(',').map((value) => value.trim()).filter(Boolean);
};

const getSelectedSortFromEmbed = (embed) => {
  const field = embed?.fields?.find((item) => item.name === 'Tri');
  if (!field) {
    return 'recent';
  }
  const match = Object.entries(SORT_OPTIONS).find(([, label]) => label === field.value);
  return match ? match[0] : 'recent';
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

    if (interaction.customId === 'catalogue_series') {
      await interaction.reply({
        content: 'Sélectionne les catégories de séries à afficher.',
        components: [buildSeriesCategoryMenu()],
        ephemeral: true
      });
      return;
    }

    if (interaction.customId === 'catalogue_animes') {
      await interaction.reply({
        content: 'Sélectionne les catégories d\'animés à afficher.',
        components: [buildAnimeCategoryMenu()],
        ephemeral: true
      });
      return;
    }

    if (interaction.customId === 'films_page_prev' || interaction.customId === 'films_page_next') {
      const embed = interaction.message.embeds[0];
      const { page } = parseFilmPageFromFooter(embed.footer?.text);
      const selectedCategories = getSelectedCategoriesFromEmbed(embed);
      const selectedSort = getSelectedSortFromEmbed(embed);
      const nextPage = interaction.customId === 'films_page_prev' ? page - 1 : page + 1;
      const { embed: nextEmbed, components } = buildFilmPagePayload(
        selectedCategories,
        nextPage,
        selectedSort
      );

      await interaction.update({ embeds: [nextEmbed], components });
    }

    if (interaction.customId === 'series_page_prev' || interaction.customId === 'series_page_next') {
      const embed = interaction.message.embeds[0];
      const { page } = parseSeriesPageFromFooter(embed.footer?.text);
      const selectedCategories = getSelectedCategoriesFromEmbed(embed);
      const selectedSort = getSelectedSortFromEmbed(embed);
      const nextPage = interaction.customId === 'series_page_prev' ? page - 1 : page + 1;
      const { embed: nextEmbed, components } = buildSeriesPagePayload(
        selectedCategories,
        nextPage,
        selectedSort
      );

      await interaction.update({ embeds: [nextEmbed], components });
    }

    if (interaction.customId === 'animes_page_prev' || interaction.customId === 'animes_page_next') {
      const embed = interaction.message.embeds[0];
      const { page } = parseAnimePageFromFooter(embed.footer?.text);
      const selectedCategories = getSelectedCategoriesFromEmbed(embed);
      const selectedSort = getSelectedSortFromEmbed(embed);
      const nextPage = interaction.customId === 'animes_page_prev' ? page - 1 : page + 1;
      const { embed: nextEmbed, components } = buildAnimePagePayload(
        selectedCategories,
        nextPage,
        selectedSort
      );

      await interaction.update({ embeds: [nextEmbed], components });
    }

    if (interaction.customId.startsWith('film_item:')) {
      const selectedFilmId = interaction.customId.split(':')[1];
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

    if (interaction.customId.startsWith('series_item:')) {
      const selectedSeriesId = interaction.customId.split(':')[1];
      const series = getSeriesById(selectedSeriesId);

      if (!series) {
        await interaction.reply({
          content: 'Impossible de trouver cette série.',
          ephemeral: true
        });
        return;
      }

      const detailEmbed = buildFilmDetailEmbed(series);
      await interaction.reply({ embeds: [detailEmbed] });
    }

    if (interaction.customId.startsWith('anime_item:')) {
      const selectedAnimeId = interaction.customId.split(':')[1];
      const anime = getAnimeById(selectedAnimeId);

      if (!anime) {
        await interaction.reply({
          content: 'Impossible de trouver cet anime.',
          ephemeral: true
        });
        return;
      }

      const detailEmbed = buildFilmDetailEmbed(anime);
      await interaction.reply({ embeds: [detailEmbed] });
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'film_categories') {
    const selectedCategories = interaction.values;
    const { embed, components } = buildFilmPagePayload(selectedCategories, 1, 'recent');

    await interaction.update({
      content: null,
      embeds: [embed],
      components
    });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'series_categories') {
    const selectedCategories = interaction.values;
    const { embed, components } = buildSeriesPagePayload(selectedCategories, 1, 'recent');

    await interaction.update({
      content: null,
      embeds: [embed],
      components
    });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'anime_categories') {
    const selectedCategories = interaction.values;
    const { embed, components } = buildAnimePagePayload(selectedCategories, 1, 'recent');

    await interaction.update({
      content: null,
      embeds: [embed],
      components
    });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'film_sort') {
    const selectedSort = interaction.values[0];
    const embed = interaction.message.embeds[0];
    const selectedCategories = getSelectedCategoriesFromEmbed(embed);
    const { embed: nextEmbed, components } = buildFilmPagePayload(
      selectedCategories,
      1,
      selectedSort
    );

    await interaction.update({ embeds: [nextEmbed], components });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'series_sort') {
    const selectedSort = interaction.values[0];
    const embed = interaction.message.embeds[0];
    const selectedCategories = getSelectedCategoriesFromEmbed(embed);
    const { embed: nextEmbed, components } = buildSeriesPagePayload(
      selectedCategories,
      1,
      selectedSort
    );

    await interaction.update({ embeds: [nextEmbed], components });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'anime_sort') {
    const selectedSort = interaction.values[0];
    const embed = interaction.message.embeds[0];
    const selectedCategories = getSelectedCategoriesFromEmbed(embed);
    const { embed: nextEmbed, components } = buildAnimePagePayload(
      selectedCategories,
      1,
      selectedSort
    );

    await interaction.update({ embeds: [nextEmbed], components });
  }

});

client.login(token);
