export const bucketURL =
  "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static";

export const blog = [
  {
    title: "Parquet",
    slug: "parquet",
    date: "11/10/26",
  },
  {
    title: "Bubbleologist",
    slug: "bubbleologist",
    date: "14/10/25",
  },
  {
    title: "Pace Factor",
    slug: "pace-factor",
    date: "06/06/25",
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

// Dump in any order — the likes page sorts A–Z (pinyin for Han, "three" for 3, …).
export const likes = [
  "Knock2",
  "Kimchi",
  "Fifth-gen fighter jets",
  "Chengdu",
  "Dirty Chai Lattes",
  "running (esp on WSH near chelsea)",
  "Go (the programming language)",
  "Nailong",
  "Masiwei",
  "Law shows (Suits, Lincoln Laywer, Better call Saul, etc.)",
  "Singapore (except when its like perma 35 degrees and humid af)",
  "Basketball",
  "告五人 (band)",
  "Dune (movies and books)",
  "3-body problem (show and book)",
  "Making sandboxes that go brrrrrrrrrrr",
  "Tiramisu",
  "New York Knicks",
  "Toronto",
  "RL Grime",
  "Optimizing for sleep",
  "Greek mythology",
  "Chainsaw Man (movie and show)",
  "Kimchi Chi Gae",
  "Chick-fil-A",
  "S3 buckets",
  "Ronghao Li",
  "Aircraft Carriers",
  "Pokémon",
  "Smoothies (esp after runs)",
  "Brutalism design",
  "Most of Denis Villeneuve's works",
  "Ian Asher",
  "Shenzhen",
  "Tiramisu lattes",
  "Trifecta",
  "Decentralized Physical Infrastructure (depin)",
  "Many more..."
];
