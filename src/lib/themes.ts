import type { Entry } from "../types";

type Theme = { bg: string; stripe: string };

const countryThemes: Record<string, Theme> = {
  denmark: {
    bg: "linear-gradient(145deg, rgba(239,68,68,0.26), rgba(255,255,255,0.075) 44%, rgba(127,29,29,0.18))",
    stripe: "from-red-300 via-white to-red-500"
  },
  germany: {
    bg: "linear-gradient(160deg, rgba(0,0,0,0.26), rgba(239,68,68,0.16) 48%, rgba(250,204,21,0.21))",
    stripe: "from-zinc-900 via-red-500 to-yellow-300"
  },
  israel: {
    bg: "linear-gradient(125deg, rgba(96,165,250,0.24), rgba(255,255,255,0.07) 45%, rgba(30,64,175,0.18))",
    stripe: "from-blue-300 via-white to-blue-500"
  },
  belgium: {
    bg: "linear-gradient(150deg, rgba(0,0,0,0.25), rgba(250,204,21,0.17) 46%, rgba(239,68,68,0.19))",
    stripe: "from-zinc-900 via-yellow-300 to-red-500"
  },
  albania: {
    bg: "linear-gradient(135deg, rgba(239,68,68,0.28), rgba(2,6,23,0.24) 52%, rgba(127,29,29,0.20))",
    stripe: "from-red-300 via-red-600 to-zinc-950"
  },
  greece: {
    bg: "linear-gradient(115deg, rgba(56,189,248,0.24), rgba(255,255,255,0.07) 50%, rgba(37,99,235,0.19))",
    stripe: "from-sky-300 via-white to-blue-500"
  },
  ukraine: {
    bg: "linear-gradient(180deg, rgba(59,130,246,0.25), rgba(250,204,21,0.18) 58%, rgba(2,6,23,0.10))",
    stripe: "from-blue-400 via-yellow-300 to-blue-500"
  },
  australia: {
    bg: "linear-gradient(140deg, rgba(59,130,246,0.25), rgba(255,255,255,0.06) 45%, rgba(239,68,68,0.14))",
    stripe: "from-blue-400 via-white to-red-400"
  },
  serbia: {
    bg: "linear-gradient(165deg, rgba(239,68,68,0.23), rgba(96,165,250,0.18) 48%, rgba(255,255,255,0.07))",
    stripe: "from-red-400 via-blue-400 to-white"
  },
  malta: { bg: "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(239,68,68,0.24))", stripe: "from-white via-red-300 to-red-600" },
  czechia: {
    bg: "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(255,255,255,0.07) 43%, rgba(239,68,68,0.17))",
    stripe: "from-blue-400 via-white to-red-400"
  },
  bulgaria: {
    bg: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(52,211,153,0.21) 48%, rgba(239,68,68,0.16))",
    stripe: "from-white via-emerald-400 to-red-500"
  },
  croatia: {
    bg: "linear-gradient(145deg, rgba(239,68,68,0.21), rgba(255,255,255,0.07) 45%, rgba(59,130,246,0.20))",
    stripe: "from-red-400 via-white to-blue-500"
  },
  "united-kingdom": {
    bg: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(255,255,255,0.07) 48%, rgba(239,68,68,0.19))",
    stripe: "from-blue-400 via-white to-red-500"
  },
  france: {
    bg: "linear-gradient(90deg, rgba(59,130,246,0.24), rgba(255,255,255,0.07) 50%, rgba(239,68,68,0.17))",
    stripe: "from-blue-400 via-white to-red-500"
  },
  moldova: {
    bg: "linear-gradient(90deg, rgba(59,130,246,0.21), rgba(250,204,21,0.18) 50%, rgba(239,68,68,0.17))",
    stripe: "from-blue-400 via-yellow-300 to-red-500"
  },
  finland: {
    bg: "linear-gradient(115deg, rgba(255,255,255,0.07), rgba(56,189,248,0.18) 44%, rgba(37,99,235,0.20))",
    stripe: "from-white via-sky-300 to-blue-600"
  },
  poland: { bg: "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(239,68,68,0.22))", stripe: "from-white via-red-300 to-red-600" },
  lithuania: {
    bg: "linear-gradient(180deg, rgba(250,204,21,0.20), rgba(52,211,153,0.18) 49%, rgba(239,68,68,0.17))",
    stripe: "from-yellow-300 via-green-400 to-red-500"
  },
  sweden: {
    bg: "linear-gradient(135deg, rgba(37,99,235,0.26), rgba(250,204,21,0.18) 48%, rgba(30,64,175,0.18))",
    stripe: "from-blue-400 via-yellow-300 to-blue-600"
  },
  cyprus: {
    bg: "linear-gradient(145deg, rgba(251,191,36,0.21), rgba(255,255,255,0.07) 48%, rgba(52,211,153,0.14))",
    stripe: "from-amber-300 via-white to-emerald-400"
  },
  italy: {
    bg: "linear-gradient(90deg, rgba(52,211,153,0.21), rgba(255,255,255,0.07) 50%, rgba(239,68,68,0.17))",
    stripe: "from-emerald-400 via-white to-red-500"
  },
  norway: {
    bg: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(255,255,255,0.07) 47%, rgba(37,99,235,0.20))",
    stripe: "from-red-400 via-white to-blue-600"
  },
  romania: {
    bg: "linear-gradient(90deg, rgba(59,130,246,0.21), rgba(250,204,21,0.18) 50%, rgba(239,68,68,0.17))",
    stripe: "from-blue-400 via-yellow-300 to-red-500"
  },
  austria: {
    bg: "linear-gradient(180deg, rgba(239,68,68,0.24), rgba(255,255,255,0.07) 50%, rgba(239,68,68,0.20))",
    stripe: "from-red-500 via-white to-red-500"
  }
};

const defaultTheme: Theme = {
  bg: "linear-gradient(135deg, rgba(217,70,239,0.20), rgba(139,92,246,0.14) 50%, rgba(34,211,238,0.16))",
  stripe: "from-fuchsia-400 via-violet-400 to-cyan-300"
};

export function getTheme(item: Entry) {
  return countryThemes[item.id] || defaultTheme;
}
