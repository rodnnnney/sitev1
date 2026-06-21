export const bucketURL = 'https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static';

export const blog = [
  {
    title: 'Pace Factor',
    slug: 'pace-factor',
    date: '06.06.25',
    description: 'Crazy effects of environments on people.',
    cover: `${bucketURL}/blog/aura.avif`,
  },
] as const;

// Bangers — songs we play. Files self-hosted in /public/songs.
export const bangers = [
  {
    title: 'Desire',
    artist: 'Ian Asher',
    url: '/songs/desire.mp3',
  },
  {
    title: 'Jar Of Love',
    artist: 'Wanting',
    url: '/songs/jar-of-love.mp3',
  },
  {
    title: 'Rock Ur World',
    artist: 'Knock2 & fussy',
    url: '/songs/rock-ur-world.mp3',
  },
] as const;

// External works worth reading — not mine, just ones I like.
export const reading = [
  {
    title: 'The Inner Ring',
    author: 'C.S. Lewis',
    href: 'https://www.lewissociety.org/innerring/',
  },
  {
    title: 'The Bitter Lesson',
    author: 'Rich Sutton',
    href: 'https://www.cs.utexas.edu/~eunsol/courses/data/bitter_lesson.pdf',
  },
] as const;
