export const images = [
    {
      src: "/camera/chengdu.png",
      alt: "Chengdu",
      description: "Chengdu, China // Jan 2024"
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
        description: "A modern portfolio website built with Next.js and TypeScript",
        link: "https://github.com/rodnnnney/lumalytics"
    },
    {
        name: "Rizz Khalifa",
        src: "/projects/rizz.png",
        description: "Full-stack e-commerce solution with React and Node.js",
        link: "https://devpost.com/software/irrizzistable-glasses#updates"

    },
    {
        name: "Cook or Cooked",
        src: "/projects/cook.png",
        description: "A collaborative task management application with real-time updates",
        link: "https://github.com/rodnnnney/cook_or_cooked"
    },
    {
        name: "ACAC Mobile",
        src: "/projects/acac.png",
        description: "Interactive weather dashboard using OpenWeather API",
        link: "https://github.com/rodnnnney/ACAC"
    }
]


export const experiences = [
    {
      title: "Software Engineer Intern",
      company: "Paytrie",
      period: "2020 - Present // Toronto, ON",
      description: "Mobile App",
      logo: "/comp/paytrie.png"
    },
    {
      title: "Software Engineer Intern",
      company: "Jackal Labs",
      period: "Jan 2025 - May 2025 // Remote",
      description: "Decentralized cloud infrastructure",
      logo: "/comp/jackie.png"
    },
    {
      title: "Founder",
      company: "Carleton Blockchain",
      period: "Nov 2024 - Present // Ottawa, ON",
      description: "Grew from 0-200 members in ~1 semester, partnered with Coinbase",
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