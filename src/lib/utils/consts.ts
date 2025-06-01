export const images = [
    {
      src: "/camera/chengdu.png",
      alt: "Chengdu",
      description: "Chengdu, China // Jan 2024"
    },
    {
      src: "/camera/to.png",
      alt: "Toronto Islands",
      description: "Toronto Islands, Canada //  2024"
    },
    {
      src: "/camera/shanghai.png",
      alt: "Shanghai",
      description: "Shanghai, China // Dec 2023"
    },
    {
      src: "/camera/toronto.png",
      alt: "Toronto",
      description: "Toronto, Canada // May 2025"
    },
    {
      src: "/camera/vancouver.png",
      alt: "Vancouver",
      description: "Vancouver, Canada // Dec 2024"
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
        src: "/projects/luma.png",

        description: "Analyzes and transforms data for Luma hosts to find insights in their events (try today!).",
        link: "https://lumalytics.app"
    },
    {
        name: "RizzKhalifa",
        src: "/projects/rizz.png",
        description: "Meta Raybans that listen to your conversations and help you rizz in real-time.",
        link: "https://devpost.com/software/irrizzistable-glasses"

    },
    {
        name: "Cook or Cooked",
        src: "/projects/cook.png",
        description: "Budgeting food app for college students",
        link: "https://github.com/rodnnnney/cook_or_cooked"
    },
    {
        name: "ACAC Mobile",
        src: "/projects/acac.png",
        description: "Mobile app for school club that serves restaurant discounts to members",
        link: "https://github.com/rodnnnney/ACAC"
    }
]


export const experiences = [
    {
      title: "Software Engineer Intern",
      company: "Paytrie",
      period: "May 2025 - Present // Toronto, ON",
      description: "Mobile app team",
      logo: "/comp/paytrie.png"
    },
    {
      title: "Software Engineer Intern",
      company: "Jackal Labs",
      period: "Jan 2025 - May 2025 // Remote",
      description: "Decentralized cloud storage",
      logo: "/comp/jackie.png"
    },
    {
      title: "Founder",
      company: "Carleton Blockchain",
      period: "Nov 2024 - Present // Ottawa, ON",
      description: "Grew from 0-200 members in ~1 semester, raised >$15,000, partnered with Coinbase",
      logo: "/comp/cu.png"
    },
    {
      title: "Scholar",
      company: "Scholar",
      period: "Oct 2024 - Present // Toronto, Vancouver, SF",
      description: "Met the coolest, kindest and most ambitious people.",
      logo: "/comp/cs.png"
    },
    {
      title: "Software Engineer Intern",
      company: "ITMZ",
      period: "May 2024 - Dec 2024 // Ottawa, ON",
      description: "Consumer mobile app",
      logo: "/comp/itmz.png"
    }
];

export const blogs = [
    {
      title: "Why Stablecoins are cool",
      link: "stables",
      date: "Dec 10, 2024",
      excerpt: "They provide the best of both worlds by pegging to real-world assets..."
    },
  ];

export const rodney = `
██████╗  ██████╗ ██████╗ ███╗   ██╗███████╗██╗   ██╗
██╔══██╗██╔═══██╗██╔══██╗████╗  ██║██╔════╝╚██╗ ██╔╝
██████╔╝██║   ██║██║  ██║██╔██╗ ██║█████╗   ╚████╔╝ 
██╔══██╗██║   ██║██║  ██║██║╚██╗██║██╔══╝    ╚██╔╝  
██║  ██║╚██████╔╝██████╔╝██║ ╚████║███████╗   ██║   
╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝   
`;

export const shen = `
███████╗██╗  ██╗███████╗███╗   ██╗
██╔════╝██║  ██║██╔════╝████╗  ██║
███████╗███████║█████╗  ██╔██╗ ██║
╚════██║██╔══██║██╔══╝  ██║╚██╗██║
███████║██║  ██║███████╗██║ ╚████║
╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝
`