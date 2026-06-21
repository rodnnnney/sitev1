export interface LinkPreviewData {
  title: string;
  description: string;
  image?: string;
}

export const linkPreviewRegistry: Record<string, LinkPreviewData> = {
  "https://textql.com/": {
    title: "TextQL | Agentic Data Analytics Platform",
    description: "Deploy Enterprise Scale Data Analyst Agents to handle your messy data workloads.",
    image: "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static/comp/tql.jpg",
  },
  "https://paytrie.com/": {
    title: "Paytrie",
    description: "Stablecoin payments infrastructure for Canada.",
    image: "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static/comp/paytrie.png",
  },
  "https://www.jackalprotocol.com/": {
    title: "Jackal Labs",
    description: "Decentralized cloud storage protocol.",
    image: "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static/comp/jackie.png",
  },
  "https://www.carletonblockchain.ca/": {
    title: "Carleton Blockchain",
    description: "University blockchain club.",
    image: "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static/comp/cu.png",
  },
  "https://lumalytics.app": {
    title: "Lumalytics",
    description: "Analyzes and transforms data for Luma hosts to find insights in their events.",
    image: "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static/projects/luma.png?v=2",
  },
  "https://devpost.com/software/irrizzistable-glasses": {
    title: "RizzKhalifa",
    description: "Meta Raybans that listen to your conversations and help you rizz in real-time.",
    image: "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static/projects/rizz.png",
  },
  "https://github.com/rodnnnney/ACAC": {
    title: "ACAC Mobile",
    description: "Mobile app for university club that serves restaurant discounts to members.",
    image: "https://pub-6cd5bf10c6f641a28ec9656b861a4fe2.r2.dev/static/projects/acac.png",
  },
};

export function getPreviewData(href: string): LinkPreviewData | undefined {
  return linkPreviewRegistry[href];
}
