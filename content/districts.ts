// The six hero towers. All copy lives here so text can change without touching scene code.
// DRAFT COPY: written only from the facts you gave me. Read it and rewrite anything that
// does not sound like you.

export type Accent = "cyan" | "violet" | "amber" | "pink";

export type District = {
  id: string;
  name: string;
  ability: string;
  accent: Accent;
  summary: string;
  body: string;
  tags: string[];
  projectIds: string[];
};

export const districts: District[] = [
  {
    id: "logic",
    name: "Logic Tower",
    ability: "Logical thinking",
    accent: "cyan",
    summary: "Algorithms, data structures, problem solving.",
    body:
      "I like problems that have a shape. Most of the work is breaking them into smaller pieces until a pattern shows up, then picking the structure that makes the answer easy to reach. Algorithms and data structures are where I learned to think in steps.",
    tags: ["Algorithms", "Data structures", "Problem solving"],
    projectIds: ["society"],
  },
  {
    id: "atelier",
    name: "The Atelier",
    ability: "Ability to create",
    accent: "violet",
    summary: "Illustration, interface design, visual storytelling.",
    body:
      "I draw. Illustration and visual storytelling are how I think when words get in the way. The same instincts shape the interfaces I design: what to show first, what to leave out, and how something should feel the first time you see it.",
    tags: ["Illustration", "Interface design", "Visual storytelling"],
    projectIds: ["art"],
  },
  {
    id: "cipher",
    name: "Cipher Vault",
    ability: "Critical thinking",
    accent: "cyan",
    summary: "Security research, identity and access, quantum curiosity.",
    body:
      "At Fiserv I work as a Technology Analyst on the identity and access management team. Outside work I do security research on kernel drivers and firmware through bug bounty programs: reading how low level code handles input, mapping where trust is assumed, and testing those assumptions. I am also curious about quantum computing and what it could mean for cryptography.",
    tags: ["Identity and access", "Kernel drivers", "Firmware", "Bug bounty", "Cryptography"],
    projectIds: ["oauth"],
  },
  {
    id: "neural",
    name: "Neural Observatory",
    ability: "AI and data",
    accent: "violet",
    summary: "Generative AI, ML automation, dashboards.",
    body:
      "During my internship at Vizset Analytics I worked on ML driven HR automation, served through REST APIs, with Apache Superset dashboards so people could see what the data was saying. I also built an OAuth onboarding assistant that uses Gemini Flash.",
    tags: ["Generative AI", "Machine learning", "Apache Superset", "Gemini Flash", "AWS Generative AI"],
    projectIds: ["hr", "oauth"],
  },
  {
    id: "harbor",
    name: "Cloud Harbor",
    ability: "Building systems",
    accent: "amber",
    summary: "AWS, Docker, Kubernetes, REST APIs, SaaS.",
    body:
      "I like building systems that hold up once real people use them. The biggest one so far is a multitenant society management SaaS that handles owners, tenants and maintenance billing. I hold the AWS Cloud Practitioner certification and I am learning Docker and Kubernetes now.",
    tags: ["AWS Cloud Practitioner", "Docker", "Kubernetes", "REST APIs", "SaaS"],
    projectIds: ["society", "hr"],
  },
  {
    id: "signal",
    name: "Signal Tower",
    ability: "Community",
    accent: "pink",
    summary: "Developer community leadership, hackathons.",
    body:
      "I led a developer community and organized hackathons. A lot of that work is quiet: finding the right people, giving them room to try things, and keeping the energy going after the event ends. I am also a Reliance Foundation Scholar.",
    tags: ["Community leadership", "Hackathons", "Reliance Foundation Scholar"],
    projectIds: [],
  },
];
