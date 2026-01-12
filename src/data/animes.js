export const animeCategories = [
  { label: 'Shonen', emoji: '⚡' },
  { label: 'Shojo', emoji: '🌸' },
  { label: 'Seinen', emoji: '🖤' },
  { label: 'Isekai', emoji: '🌀' },
  { label: 'Slice of Life', emoji: '🍃' },
  { label: 'Mecha', emoji: '🤖' },
  { label: 'Fantastique', emoji: '🧚' },
  { label: 'Action', emoji: '💥' },
  { label: 'Comédie', emoji: '😂' },
  { label: 'Romance', emoji: '💞' }
];

export const animes = [
  {
    id: 'skyblade',
    title: 'Skyblade Academy',
    emoji: '⚡',
    categories: ['Shonen', 'Action'],
    addedAt: '2024-08-21',
    releaseDate: '15/04/2023',
    summary: 'Un étudiant découvre une lame mystique qui réveille des pouvoirs anciens.',
    url: 'https://example.com/skyblade-academy',
    image: 'https://images.unsplash.com/photo-1516117172878-fd2c41f4a759?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'moonpetal',
    title: 'Moonpetal',
    emoji: '🌸',
    categories: ['Shojo', 'Romance'],
    addedAt: '2024-08-10',
    releaseDate: '09/02/2022',
    summary: 'Une romance magique née sous les fleurs de cerisier.',
    url: 'https://example.com/moonpetal',
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'orbit-iron',
    title: 'Orbit Iron',
    emoji: '🤖',
    categories: ['Mecha', 'Seinen'],
    addedAt: '2024-07-28',
    releaseDate: '01/09/2021',
    summary: 'Des pilotes d’élite défendent une colonie spatiale isolée.',
    url: 'https://example.com/orbit-iron',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'otherworld-town',
    title: 'Otherworld Town',
    emoji: '🌀',
    categories: ['Isekai', 'Fantastique'],
    addedAt: '2024-07-12',
    releaseDate: '24/06/2020',
    summary: 'Une héroïne se réveille dans une ville régie par la magie.',
    url: 'https://example.com/otherworld-town',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'breeze-days',
    title: 'Breeze Days',
    emoji: '🍃',
    categories: ['Slice of Life', 'Comédie'],
    addedAt: '2024-06-30',
    releaseDate: '08/11/2019',
    summary: 'Une bande d’amis transforme un café en repaire de créativité.',
    url: 'https://example.com/breeze-days',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'ember-song',
    title: 'Ember Song',
    emoji: '🧚',
    categories: ['Fantastique', 'Romance'],
    addedAt: '2024-06-18',
    releaseDate: '12/03/2021',
    summary: 'Une barde féérique protège un village d’ombres antiques.',
    url: 'https://example.com/ember-song',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80'
  }
];

export const getAnimesByCategories = (selectedCategories) => {
  const normalized = selectedCategories.length
    ? selectedCategories
    : animeCategories.map((category) => category.label);

  return animes
    .filter((item) => item.categories.some((category) => normalized.includes(category)))
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
};

export const getAnimeById = (animeId) => animes.find((item) => item.id === animeId);
