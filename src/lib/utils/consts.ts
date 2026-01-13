
export const bucketURL = "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static"
export const images = [
    {
      src: bucketURL + "/camera/nyc.png",
      alt: "New York City",
      description: "New York City, USA // May 2025",
    },
    {
      src: bucketURL + "/camera/sf.png",
      alt: "San Francisco",
      description: "San Francisco, USA // Nov 2025",
    },
    {
      src: bucketURL + "/camera/shanghai.png",
      alt: "Shanghai",
      description: "Shanghai, China // Dec 2023",
    },
    {
      src: bucketURL + "/camera/chengdu.png",
      alt: "Chengdu",
      description: "Chengdu, China // Jan 2024",
    },
    {
      src: bucketURL + "/camera/toronto.png",
      alt: "Toronto",
      description: "Toronto, Canada // May 2025",
    },
    {
      src: bucketURL + "/camera/vancouver.png",
      alt: "Vancouver",
      description: "Vancouver, Canada // Dec 2024",
    },
]

type Project = {
    name: string;
    src: string;
    description: string; 
    link: string;
}


export const projects: Project[] = [
    {
        name: "Lumalytics",
        src: bucketURL + "/projects/luma.png?v=2",
        description: "Analyzes and transforms data for Luma hosts to find insights in their events (try today!).",
        link: "https://lumalytics.app",
    },
    {
        name: "RizzKhalifa",
        src: bucketURL + "/projects/rizz.png",
        description: "Meta Raybans that listen to your conversations and help you rizz in real-time.",
        link: "https://devpost.com/software/irrizzistable-glasses",
    },
    // {
    //     name: "Cook or Cooked",
    //     src: bucketURL + "/projects/cook.png",
    //     description: "Budgeting food app for college students",
    //     link: "https://github.com/rodnnnney/cook_or_cooked"
    // },
    {
        name: "ACAC Mobile",
        src: bucketURL + "/projects/acac.png",
        description: "Mobile app for university club that serves restaurant discounts to members",
        link: "https://github.com/rodnnnney/ACAC"
    }
]


export const experiences = [
  {
    title: "Member of Technical Staff",
    link: "https://textql.com/",
    company: "TextQL",
    period: "September 2025 - Present | NYC, NY", 
    description: "Enterprise data science agents",
    logo: bucketURL + "/comp/tql.jpg"
  },
    {
      title: "Software Engineer Intern",
      link: "https://paytrie.com/",
      company: "Paytrie",
      period: "May 2025 - August 2025 | Toronto, ON",
      description: "Mobile app team - Stablecoins",
      logo: bucketURL + "/comp/paytrie.png"
    },
    {
      title: "Software Engineer Intern",
      link: "https://www.jackalprotocol.com/",
      company: "Jackal Labs",
      period: "Jan 2025 - May 2025 | Remote",
      description: "Decentralized cloud storage",
      logo: bucketURL + "/comp/jackie.png"
    },
    {
      title: "Founder",
      company: "Carleton Blockchain",
      link: "https://www.carletonblockchain.ca/",
      period: "Nov 2024 - September 2025 | Ottawa, ON",
      description: "Grew from 0-200 members in ~1 semester, raised >$15,000, partnered with Coinbase",
      logo: bucketURL + "/comp/cu.png"
    },
];

export const blog = [
    {
      title: "Pace Factor",
      link: "pacing",
      date: "June 6, 2025",
      excerpt: "",
      cover_img: bucketURL + "/blog/aura.avif"
    }
  ];

export const bangers = [
  {
    title: "跳楼机 (Jumping Machine)",
    link: "https://open.spotify.com/track/1XZE0InCx3SdCnLpVsPpZl?si=992084569f6d4efb",
    cover_img: bucketURL + "/bangers/jump.jpg"
  },
  {
    title: "Starlight",
    link: "https://open.spotify.com/track/531KGXtBroSrOX9LVmiIgc?si=94fa4b72d53443e5",
    cover_img: bucketURL + "/bangers/star.png"
  },
  
  {
    title: "Lady Of Namek",
    link: "https://open.spotify.com/track/3UqWPDav8MenwVNwUIZFA8?si=077391a31384434f",
    cover_img: bucketURL + "/bangers/tory.png"
  },
  {
    title: "Peak",
    link: "https://open.spotify.com/track/11L064movtyopGdLiX4sVg?si=e88ed473c7a7461c",
    cover_img: bucketURL + "/bangers/dri.png"
  },
  {
    title: "Atmosphere",
    link: "https://open.spotify.com/track/63HwAAXuSV2tzIUPoHOwZa?si=4997ee66507f455b",
    cover_img: bucketURL + "/bangers/atmo.png"
  },
  {
    title: "Feel No Ways",
    link: "https://open.spotify.com/track/3cjF2OFRmip8spwZYQRKxP?si=454a07bab5a740c1",
    cover_img: bucketURL + "/bangers/dri2.png"
  }
]