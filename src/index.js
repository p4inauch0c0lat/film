import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GatewayIntentBits,
  StringSelectMenuBuilder
} from 'discord.js';
import { buildCatalogueEmbed } from './embeds/catalogue.js';
import { buildFilmDetailEmbed, buildSeasonDetailEmbed } from './embeds/filmDetails.js';
import { buildFilmListEmbed, parsePageFromFooter as parseFilmPageFromFooter } from './embeds/films.js';
import { buildAnimeListEmbed, parsePageFromFooter as parseAnimePageFromFooter } from './embeds/animes.js';
import { buildSeriesListEmbed, parsePageFromFooter as parseSeriesPageFromFooter } from './embeds/series.js';
import { addFilm, filmCategories, getFilmById, getFilmsByCategories } from './data/films.js';
import { addAnime, animeCategories, getAnimeById, getAnimesByCategories } from './data/animes.js';
import { addSeries, seriesCategories, getSeriesById, getSeriesByCategories } from './data/series.js';
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
const ADD_COMMAND = '!ajouter';

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

const buildReceiveDmButton = (customId) =>
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(customId)
      .setLabel('Recevoir en MP')
      .setStyle(ButtonStyle.Primary)
  );

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

const normalizeInput = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const toSlug = (value) =>
  normalizeInput(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const generateUniqueId = (base, existsFn) => {
  let candidate = base;
  let index = 2;
  while (existsFn(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
};

const askQuestion = async (message, prompt, validate) => {
  while (true) {
    await message.channel.send(prompt);
    const collected = await message.channel.awaitMessages({
      filter: (response) => response.author.id === message.author.id,
      max: 1,
      time: 120000
    });

    if (!collected.size) {
      throw new Error('timeout');
    }

    const response = collected.first().content.trim();
    if (normalizeInput(response) === 'annuler') {
      throw new Error('cancelled');
    }

    if (!validate) {
      return response;
    }

    const result = validate(response);
    if (result?.valid) {
      return result.value ?? response;
    }

    await message.channel.send(result?.error || 'Réponse invalide, réessaie.');
  }
};

const parseCategories = (input, options) => {
  const map = new Map(options.map((option) => [normalizeInput(option), option]));
  const raw = input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!raw.length) {
    return { valid: false, error: 'Merci de préciser au moins une catégorie.' };
  }

  const resolved = [];
  for (const entry of raw) {
    const normalized = normalizeInput(entry);
    const match = map.get(normalized);
    if (!match) {
      return {
        valid: false,
        error: `Catégorie inconnue: ${entry}.`
      };
    }
    if (!resolved.includes(match)) {
      resolved.push(match);
    }
  }

  return { valid: true, value: resolved };
};

const parsePositiveInt = (input, label) => {
  const value = Number.parseInt(input, 10);
  if (!Number.isInteger(value) || value <= 0) {
    return { valid: false, error: `Merci de donner un nombre valide pour ${label}.` };
  }
  return { valid: true, value };
};

const handleInteractiveAdd = async (message) => {
  await message.channel.send(
    'Commande ajout interactive démarrée. Tape `annuler` à tout moment pour arrêter.'
  );

  const type = await askQuestion(
    message,
    'Que veux-tu ajouter ? (`film`, `serie`, `anime`)',
    (input) => {
      const normalized = normalizeInput(input);
      if (['film', 'serie', 'anime'].includes(normalized)) {
        return { valid: true, value: normalized };
      }
      return {
        valid: false,
        error: 'Choisis `film`, `serie` ou `anime`.'
      };
    }
  );

  const title = await askQuestion(message, 'Quel est le titre ?');
  const releaseDate = await askQuestion(
    message,
    'Quelle est la date de sortie ? (format JJ/MM/AAAA)'
  );
  const summary = await askQuestion(message, 'Quelle est la description ?');
  const image = await askQuestion(message, "Quel est l'URL de l'image ?");

  const today = new Date().toISOString().slice(0, 10);
  const baseId = toSlug(title) || `item-${Date.now()}`;

  if (type === 'film') {
    const categories = await askQuestion(
      message,
      `Quelles catégories ? (choisis parmi: ${filmCategories.join(', ')})`,
      (input) => parseCategories(input, filmCategories)
    );
    const url = await askQuestion(message, 'Quel est le lien du film ?');
    const id = generateUniqueId(baseId, (candidate) => Boolean(getFilmById(candidate)));

    const film = {
      id,
      title,
      emoji: '🎬',
      categories,
      addedAt: today,
      releaseDate,
      summary,
      url,
      image
    };

    addFilm(film);
    await message.channel.send(`✅ Film ajouté: **${title}**.`);
    return;
  }

  const categoryOptions =
    type === 'serie'
      ? seriesCategories.map((category) => category.label)
      : animeCategories.map((category) => category.label);

  const categories = await askQuestion(
    message,
    `Quelles catégories ? (choisis parmi: ${categoryOptions.join(', ')})`,
    (input) => parseCategories(input, categoryOptions)
  );

  const season = await askQuestion(message, 'Quel est le numéro de saison ?', (input) =>
    parsePositiveInt(input, 'la saison')
  );
  const episodeCount = await askQuestion(
    message,
    "Combien d'épisodes dans la saison ?",
    (input) => parsePositiveInt(input, "le nombre d'épisodes")
  );

  const episodes = [];
  for (let index = 1; index <= episodeCount; index += 1) {
    const episodeTitle = await askQuestion(
      message,
      `Titre de l'épisode ${index} ?`
    );
    const episodeUrl = await askQuestion(
      message,
      `Lien de l'épisode ${index} ?`
    );
    episodes.push({ number: index, title: episodeTitle, url: episodeUrl });
  }

  const url = episodes[0]?.url || 'https://example.com';
  const isSeries = type === 'serie';
  const id = generateUniqueId(baseId, (candidate) =>
    isSeries ? Boolean(getSeriesById(candidate)) : Boolean(getAnimeById(candidate))
  );

  const item = {
    id,
    title,
    season,
    emoji: isSeries ? '📺' : '🍥',
    categories,
    addedAt: today,
    releaseDate,
    summary,
    url,
    image,
    episodes
  };

  if (isSeries) {
    addSeries(item);
    await message.channel.send(`✅ Série ajoutée: **${title}** saison ${season}.`);
    return;
  }

  addAnime(item);
  await message.channel.send(`✅ Animé ajouté: **${title}** saison ${season}.`);
};

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) {
    return;
  }

  if (normalizeInput(message.content) === normalizeInput(ADD_COMMAND)) {
    try {
      await handleInteractiveAdd(message);
    } catch (error) {
      if (error.message === 'cancelled') {
        await message.channel.send('❌ Ajout annulé.');
        return;
      }
      if (error.message === 'timeout') {
        await message.channel.send('⌛ Temps écoulé. Recommence la commande.');
        return;
      }
      console.error(error);
      await message.channel.send('Une erreur est survenue pendant la commande.');
    }
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

      const detailEmbed = buildSeasonDetailEmbed(series);
      await interaction.reply({
        embeds: [detailEmbed],
        components: [buildReceiveDmButton(`series_dm:${series.id}`)]
      });
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

      const detailEmbed = buildSeasonDetailEmbed(anime);
      await interaction.reply({
        embeds: [detailEmbed],
        components: [buildReceiveDmButton(`anime_dm:${anime.id}`)]
      });
    }

    if (interaction.customId.startsWith('series_dm:')) {
      const selectedSeriesId = interaction.customId.split(':')[1];
      const series = getSeriesById(selectedSeriesId);

      if (!series) {
        await interaction.reply({
          content: 'Impossible de trouver cette série.',
          ephemeral: true
        });
        return;
      }

      const episodes = series.episodes?.length
        ? series.episodes
            .map((episode) => `Épisode ${episode.number} — ${episode.title}: ${episode.url}`)
            .join('\n')
        : 'Aucun épisode disponible.';

      await interaction.user.send({
        content: `🎬 **${series.title} — Saison ${series.season}**\n${episodes}`
      });

      await interaction.reply({
        content: 'Je t’ai envoyé la saison en MP.',
        ephemeral: true
      });
    }

    if (interaction.customId.startsWith('anime_dm:')) {
      const selectedAnimeId = interaction.customId.split(':')[1];
      const anime = getAnimeById(selectedAnimeId);

      if (!anime) {
        await interaction.reply({
          content: 'Impossible de trouver cet anime.',
          ephemeral: true
        });
        return;
      }

      const episodes = anime.episodes?.length
        ? anime.episodes
            .map((episode) => `Épisode ${episode.number} — ${episode.title}: ${episode.url}`)
            .join('\n')
        : 'Aucun épisode disponible.';

      await interaction.user.send({
        content: `🎬 **${anime.title} — Saison ${anime.season}**\n${episodes}`
      });

      await interaction.reply({
        content: 'Je t’ai envoyé la saison en MP.',
        ephemeral: true
      });
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
