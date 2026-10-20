// Copy for the gate, contact and other site wide text.
// Edit freely; no scene code depends on the wording.

export const site = {
  name: "M S SHRUTHI",
  tagline:
    "I build things, take them apart to see why they work, and draw what I find along the way.",
  enterLabel: "Enter the city",
  enterHint: "or scroll",
  enterHintTouch: "or swipe up",
  lookUpLabel: "or look up at what I made",
  skyHint: "Each constellation is something I made. Pick one.",
  streetHint: "Six towers, one for each part of how I work. Click one, or press Tab to move between them.",

  // The autopilot tour. Each district and project stop uses its own copy from the content files.
  tour: {
    label: "60 second tour",
    gateLabel: "Short on time? Take the 60 second tour",
    introTitle: "Night city",
    intro: "Six districts, one for each part of how I work. Then the things I made, up in the sky.",
    skyTitle: "The sky",
    sky: "Every constellation up here is a project.",
    outroTitle: "That is the city",
    outro: "Click any tower or constellation to read more, or take the plain version.",
    stop: "Stop tour",
  },

  // Each line is a list of segments so single words can carry their own color.
  // tone: "cmd" lines type slower, "wait" lines show an animated ellipsis.
  terminal: [
    { tone: "cmd", segments: [{ text: "GET /authorize?client=visitor" }] },
    { tone: "wait", segments: [{ text: "resolving identity" }] },
    {
      tone: "out",
      segments: [
        { text: "claims: " },
        { text: "engineer", color: "cyan" },
        { text: " " },
        { text: "artist", color: "violet" },
        { text: " " },
        { text: "researcher", color: "cyan" },
        { text: " " },
        { text: "organizer", color: "pink" },
        { text: " " },
        { text: "problem solver", color: "amber" },
      ],
    },
    { tone: "out", segments: [{ text: "mode: " }, { text: "curious", color: "violet" }] },
    { tone: "ok", segments: [{ text: "200 OK", color: "cyan" }, { text: " welcome to the city" }] },
  ],
  accessGranted: "ACCESS GRANTED",

  contact: {
    heading: "Got a problem worth thinking about?",
    // Placeholders: replace with real links.
    email: "you@example.com",
    linkedin: "https://www.linkedin.com/in/your-handle",
    github: "https://github.com/your-handle",
  },
} as const;

export type TerminalColor = "cyan" | "violet" | "amber" | "pink";
export type TerminalLine = (typeof site.terminal)[number];
