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

// Bangers — songs we play. Assets (mp3 + .lrc + .beats.json) live on R2 under
// ${bucketURL}/songs. `rave: true` enables the full strobe + word-scramble drop
// effect; others just get the (calmer) beat shake + ambient glow.
export const bangers = [
  {
    title: 'Desire',
    artist: 'Ian Asher',
    url: `${bucketURL}/songs/desire.mp3`,
    rave: true,
  },
  {
    title: 'Jar Of Love',
    artist: 'Wanting',
    url: `${bucketURL}/songs/jar-of-love.mp3`,
    rave: false,
  },
  {
    title: 'Rock Ur World',
    artist: 'Knock2 & fussy',
    url: `${bucketURL}/songs/rock-ur-world.mp3`,
    rave: true,
  },
  {
    title: 'Atmosphere',
    artist: 'Fisher',
    url: `${bucketURL}/songs/atmosphere.mp3`,
    rave: true,
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
