// "Things I made". Image, link and stack fields are placeholders to fill in.

export type Project = {
  id: string;
  title: string;
  kind: string;
  summary: string;
  stack: string[];
  image?: string; // e.g. "/projects/society.webp"
  link?: string;
};

export const projects: Project[] = [
  {
    id: "society",
    title: "Society management platform",
    kind: "Multitenant SaaS",
    summary:
      "A platform for residential societies. Owners, tenants and maintenance billing each get their own flow, and every society lives in its own tenant.",
    stack: ["TODO: stack"],
  },
  {
    id: "oauth",
    title: "OAuth onboarding assistant",
    kind: "Generative AI",
    summary: "An assistant that walks people through OAuth onboarding, built on Gemini Flash.",
    stack: ["Gemini Flash", "OAuth", "TODO: stack"],
  },
  {
    id: "hr",
    title: "HR automation at Vizset Analytics",
    kind: "Internship",
    summary:
      "ML driven HR automation exposed through REST APIs, with Apache Superset dashboards on top.",
    stack: ["Machine learning", "REST APIs", "Apache Superset"],
  },
  {
    id: "art",
    title: "TODO: illustration project",
    kind: "Illustration",
    summary: "TODO: a sentence about a piece or series of your artwork.",
    stack: ["TODO: medium or tools"],
  },
];
