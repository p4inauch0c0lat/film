export const filmCategories = [
  'Action',
  'Aventure',
  'Comédie',
  'Drame',
  'Fantastique',
  'Horreur',
  'Romance',
  'Science-fiction',
  'Thriller'
];

export const films = [
  {
    title: 'Nuit Écarlate',
    emoji: '🌙',
    categories: ['Drame', 'Romance'],
    addedAt: '2024-08-18'
  },
  {
    title: 'Circuit Fantôme',
    emoji: '🏎️',
    categories: ['Action', 'Thriller'],
    addedAt: '2024-08-12'
  },
  {
    title: 'Lueur Boréale',
    emoji: '❄️',
    categories: ['Aventure', 'Fantastique'],
    addedAt: '2024-07-30'
  },
  {
    title: 'Rire de Minuit',
    emoji: '😂',
    categories: ['Comédie'],
    addedAt: '2024-07-22'
  },
  {
    title: 'Horizon Rouge',
    emoji: '🚀',
    categories: ['Science-fiction', 'Action'],
    addedAt: '2024-07-18'
  },
  {
    title: 'Le Pacte',
    emoji: '🕯️',
    categories: ['Horreur', 'Thriller'],
    addedAt: '2024-07-10'
  },
  {
    title: 'Évasion Sauvage',
    emoji: '🌿',
    categories: ['Aventure', 'Action'],
    addedAt: '2024-06-28'
  },
  {
    title: 'Coeurs Croisés',
    emoji: '💞',
    categories: ['Romance', 'Comédie'],
    addedAt: '2024-06-16'
  },
  {
    title: 'Ligne Brisée',
    emoji: '🧩',
    categories: ['Drame', 'Thriller'],
    addedAt: '2024-06-08'
  },
  {
    title: 'Chant des Ombres',
    emoji: '🎻',
    categories: ['Fantastique', 'Drame'],
    addedAt: '2024-05-28'
  },
  {
    title: 'Folie Douce',
    emoji: '🍬',
    categories: ['Comédie'],
    addedAt: '2024-05-20'
  },
  {
    title: 'Aube Mécanique',
    emoji: '⚙️',
    categories: ['Science-fiction', 'Action'],
    addedAt: '2024-05-12'
  }
];

export const getFilmsByCategories = (selectedCategories) => {
  const normalized = selectedCategories.length
    ? selectedCategories
    : filmCategories;

  return films
    .filter((film) => film.categories.some((category) => normalized.includes(category)))
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
};
