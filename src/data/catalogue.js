const parseNumber = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const getCatalogueStats = () => ({
  filmCount: parseNumber(process.env.FILM_COUNT),
  seriesCount: parseNumber(process.env.SERIES_COUNT),
  seasonsCount: parseNumber(process.env.SEASONS_COUNT),
  episodesCount: parseNumber(process.env.EPISODES_COUNT),
  totalLinks: parseNumber(process.env.TOTAL_LINKS),
  statusUrl: process.env.STATUS_URL || 'https://example.com/status'
});
