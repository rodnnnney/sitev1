export const bucketURL =
  "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static";

export const blog = [
  {
    title: "More Bubbles",
    slug: "more-bubbles",
    date: "14/10/25",
    description: "Why we need more bubbles, not fewer.",
    cover: `${bucketURL}/blog/aura.avif`,
  },
  {
    title: "Pace Factor",
    slug: "pace-factor",
    date: "06/06/25",
    description: "Slow cities, fast cities, and the cost of each.",
    cover: `${bucketURL}/blog/aura.avif`,
  },
] as const;

// Bangers — songs we play. Each song has its own R2 folder holding the mp3 +
// .lrc + .beats.json: ${bucketURL}/songs/<slug>/<slug>.{mp3,lrc,beats.json}.
// `rave: true` enables the full strobe + word-scramble drop effect; others
// just get the (calmer) beat shake + ambient glow.
export const bangers = [
  {
    title: "Desire",
    artist: "Ian Asher",
    url: `${bucketURL}/songs/desire/desire.mp3`,
    cover: `${bucketURL}/songs/desire/cover.jpg`,
    rave: true,
  },
  {
    title: "Rock Ur World",
    artist: "Knock2 & fussy",
    url: `${bucketURL}/songs/rock-ur-world/rock-ur-world.mp3`,
    cover: `${bucketURL}/songs/rock-ur-world/cover.jpg`,
    rave: true,
  },
  {
    title: "Atmosphere",
    artist: "Fisher",
    url: `${bucketURL}/songs/atmosphere/atmosphere.mp3`,
    cover: `${bucketURL}/songs/atmosphere/cover.jpg`,
    rave: true,
  },
  {
    title: "Ocean",
    artist: "Fisher",
    url: `${bucketURL}/songs/ocean/ocean.mp3`,
    cover: `${bucketURL}/songs/ocean/cover.jpg`,
    rave: true,
  },
  {
    title: "SHADOWS",
    artist: "John Summit",
    url: `${bucketURL}/songs/shadows/shadows.mp3`,
    cover: `${bucketURL}/songs/shadows/cover.jpg`,
    rave: true,
  },
  {
    title: "MONEY ON THE DASH (sped up)",
    artist: "Elley Duhé",
    url: `${bucketURL}/songs/money-on-the-dash/money-on-the-dash.mp3`,
    cover: `${bucketURL}/songs/money-on-the-dash/cover.jpg`,
    rave: true,
  },
] as const;

// External works worth reading — not mine, just ones I like.
export const reading = [
  {
    title: "Boom: Bubbles and the End of Stagnation",
    author: "Byrne Hobart & Tobias Huber",
    href: "https://press.stripe.com/boom",
  },
  {
    title: "The Inner Ring",
    author: "C.S. Lewis",
    href: "https://www.lewissociety.org/innerring/",
  },
  {
    title: "The Bitter Lesson",
    author: "Rich Sutton",
    href: "https://www.cs.utexas.edu/~eunsol/courses/data/bitter_lesson.pdf",
  },
] as const;
