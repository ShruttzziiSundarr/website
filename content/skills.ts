// Stars in the skill constellation. Edit the lines freely.
// DRAFT COPY: keep each line honest about where you actually are with the skill.

export type Cluster = "CREATE" | "LOGIC" | "QUESTION" | "BUILD";

export type Skill = {
  id: string;
  label: string;
  cluster: Cluster;
  line: string;
};

export const clusters: { id: Cluster; accent: "cyan" | "violet" | "amber" | "pink" }[] = [
  { id: "CREATE", accent: "violet" },
  { id: "LOGIC", accent: "cyan" },
  { id: "QUESTION", accent: "pink" },
  { id: "BUILD", accent: "amber" },
];

export const skills: Skill[] = [
  { id: "illustration", label: "Illustration", cluster: "CREATE", line: "Where I go to think without a keyboard." },
  { id: "interface", label: "Interface design", cluster: "CREATE", line: "Deciding what someone sees first, and what they never need to see." },
  { id: "story", label: "Visual storytelling", cluster: "CREATE", line: "Turning an idea into a picture people can follow." },

  { id: "algorithms", label: "Algorithms", cluster: "LOGIC", line: "Where I learned to think in steps." },
  { id: "ds", label: "Data structures", cluster: "LOGIC", line: "The right shape usually makes the problem smaller." },
  { id: "debugging", label: "Debugging", cluster: "LOGIC", line: "Patient guessing, then proving the guess." },

  { id: "quantum", label: "Quantum and cryptography", cluster: "QUESTION", line: "Curiosity more than expertise, and I am honest about that." },
  { id: "security", label: "Security research", cluster: "QUESTION", line: "Kernel drivers and firmware, through bug bounty programs." },
  { id: "iam", label: "Identity and access", cluster: "QUESTION", line: "My day job at Fiserv: who gets in, and why." },

  { id: "aws", label: "AWS cloud", cluster: "BUILD", line: "AWS Cloud Practitioner certified." },
  { id: "containers", label: "Docker and Kubernetes", cluster: "BUILD", line: "Learning now. Containers first, orchestration next." },
  { id: "genai", label: "Generative AI", cluster: "BUILD", line: "Used it to build an OAuth onboarding assistant on Gemini Flash." },
  { id: "saas", label: "SaaS products", cluster: "BUILD", line: "A multitenant society management platform, end to end." },
  { id: "community", label: "Community", cluster: "BUILD", line: "Led a developer community and organized hackathons." },
];

// Lines between related stars. Cross cluster links show how the skills feed each other.
export const skillLinks: [string, string][] = [
  ["illustration", "story"],
  ["interface", "story"],
  ["algorithms", "ds"],
  ["ds", "debugging"],
  ["security", "iam"],
  ["security", "quantum"],
  ["aws", "containers"],
  ["saas", "aws"],
  ["genai", "saas"],
  // across clusters
  ["story", "quantum"],
  ["debugging", "saas"],
  ["debugging", "security"],
  ["interface", "saas"],
  ["algorithms", "quantum"],
  ["iam", "genai"],
  ["community", "story"],
];
