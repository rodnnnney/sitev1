export const bucketURL =
  "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static";

export const blog = [
  {
    title: "Pace Factor",
    slug: "pace-factor",
    date: "06.06.25",
    description: "Crazy effects of environments on people.",
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
    title: "Jar Of Love",
    artist: "Wanting",
    url: `${bucketURL}/songs/jar-of-love/jar-of-love.mp3`,
    cover: `${bucketURL}/songs/jar-of-love/cover.jpg`,
    rave: false,
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
    title: "FUCK THE SPEAKERZ UP",
    artist: "ISOxo",
    url: `${bucketURL}/songs/fuck-the-speakerz-up/fuck-the-speakerz-up.mp3`,
    cover: `${bucketURL}/songs/fuck-the-speakerz-up/cover.jpg`,
    rave: true,
  },
  {
    title: "MONEY ON THE DASH (sped up)",
    artist: "Elley Duhé",
    url: `${bucketURL}/songs/money-on-the-dash/money-on-the-dash.mp3`,
    cover: `${bucketURL}/songs/money-on-the-dash/cover.jpg`,
    rave: true,
  },
  {
    title: "Go On Then, Love",
    artist: "Said The Sky",
    url: `${bucketURL}/songs/go-on-then-love/go-on-then-love.mp3`,
    cover: `${bucketURL}/songs/go-on-then-love/cover.jpg`,
    rave: true,
  },
] as const;

// External works worth reading — not mine, just ones I like.
export const reading = [
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
