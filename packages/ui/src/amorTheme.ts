export const amorTheme = {
  color: {
    petrol: "#0E4C54",
    petrolDeep: "#0A373D",
    petrolNight: "#072A2F",
    teal: "#1C8A8F",
    tealSoft: "#5AA6A8",
    amber: "#E0A458",
    amberDeep: "#C6863A",
    clay: "#BE6E52",
    glacier: "#88B0B5",
    ink: "#16242A",
    inkSoft: "#3C4F55",
    slate: "#5E7378",
    paper: "#F6F4EE",
    paperPure: "#FBFAF6",
    mist: "#E7EBEA",
    line: "#D4DBDA",
    lineSoft: "#E2E7E6"
  },
  font: {
    display: "\"Space Grotesk\", system-ui, sans-serif",
    body: "\"IBM Plex Sans\", system-ui, sans-serif",
    mono: "\"IBM Plex Mono\", ui-monospace, monospace",
    serif: "\"Newsreader\", Georgia, serif"
  },
  chart: {
    categorical: ["#0E4C54", "#1C8A8F", "#E0A458", "#88B0B5", "#BE6E52", "#5E7378"],
    baseline: "#0E4C54",
    treatment: "#1C8A8F",
    highlight: "#E0A458",
    uncertainty: "rgba(136, 176, 181, 0.28)"
  }
} as const;

export type AmorTheme = typeof amorTheme;

