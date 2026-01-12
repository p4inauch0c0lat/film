export const seriesCategories = [
  { label: 'Drame', emoji: '😭' },
  { label: 'Fantastique', emoji: '🧙' },
  { label: 'Français', emoji: '🇫🇷' },
  { label: 'Guerre', emoji: '⚔️' },
  { label: 'Horreur', emoji: '👻' },
  { label: 'Marvel', emoji: '🦸' },
  { label: 'Netflix', emoji: '🟥' },
  { label: 'Romantique', emoji: '💞' },
  { label: 'Science-Fiction', emoji: '👽' },
  { label: 'Thriller', emoji: '🕵️' },
  { label: 'Warner', emoji: '🎬' }
];

export const series = [
  {
    id: 'white-night',
    title: 'White Night',
    emoji: '🌙',
    categories: ['Drame', 'Thriller'],
    addedAt: '2024-08-19',
    releaseDate: '10/01/2023',
    summary: 'Une enquête sombre qui remonte le fil d’un secret familial.',
    url: 'https://example.com/white-night',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'frontline',
    title: 'Frontline 1944',
    emoji: '⚔️',
    categories: ['Guerre', 'Drame'],
    addedAt: '2024-08-12',
    releaseDate: '03/11/2022',
    summary: 'Des soldats liés par un serment cherchent la vérité sur leur mission.',
    url: 'https://example.com/frontline-1944',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'heartsignal',
    title: 'HeartSignal',
    emoji: '💞',
    categories: ['Romantique', 'Drame'],
    addedAt: '2024-08-05',
    releaseDate: '19/02/2024',
    summary: 'Une appli de rencontres bouscule les destinées de trois amis.',
    url: 'https://example.com/heartsignal',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'netstream',
    title: 'NetStream Stories',
    emoji: '🟥',
    categories: ['Netflix', 'Fantastique'],
    addedAt: '2024-07-29',
    releaseDate: '07/06/2023',
    summary: 'Une anthologie étrange au cœur d’un service de streaming.',
    url: 'https://example.com/netstream-stories',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'hexen',
    title: 'Hexen',
    emoji: '🧙',
    categories: ['Fantastique'],
    addedAt: '2024-07-12',
    releaseDate: '12/10/2021',
    summary: 'Une lignée de sorcières doit protéger un grimoire interdit.',
    url: 'https://example.com/hexen',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'lumiere',
    title: 'Lumière',
    emoji: '🇫🇷',
    categories: ['Français', 'Drame'],
    addedAt: '2024-06-30',
    releaseDate: '22/09/2020',
    summary: 'Une troupe de théâtre se bat pour sauver sa salle historique.',
    url: 'https://example.com/lumiere',
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=400&q=80'
  }
];

export const getSeriesByCategories = (selectedCategories) => {
  const normalized = selectedCategories.length
    ? selectedCategories
    : seriesCategories.map((category) => category.label);

  return series
    .filter((item) => item.categories.some((category) => normalized.includes(category)))
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
};

export const getSeriesById = (seriesId) => series.find((item) => item.id === seriesId);
