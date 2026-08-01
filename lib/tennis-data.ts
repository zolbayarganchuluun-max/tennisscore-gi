export type FormResult = "W" | "L"

export type SurfaceKey = "Grass" | "Hard" | "Clay"

// A single recent match result, tagged with the surface it was played on.
export type FormEntry = {
  result: FormResult
  surface: SurfaceKey
  opponent: string
}

// Per-surface performance breakdown shown in the analysis drawer.
export type SurfaceStat = {
  winRate: number // 0-100
  yearRecord: { wins: number; losses: number }
}

export type Player = {
  name: string
  country: string // ISO-ish code shown on flag chip
  rank: number
  seed?: number
  form: FormResult[] // most recent last
  formMatches: FormEntry[]
  surfaceStats: Record<SurfaceKey, SurfaceStat>
}

export type H2HMatch = {
  year: string
  tournament: string
  surface: SurfaceKey
  round: string
  winner: string // player name
  score: string
}

export type AIPrediction = {
  predictedWinner: string
  winProbability: number // 0-100
  summary: string
  keyFactors: string[]
}

export type SetScore = {
  p1: number
  p2: number
  // tiebreak points, optional
  p1tb?: number
  p2tb?: number
}

export type Match = {
  id: string
  time: string
  surface: SurfaceKey
  p1: Player
  p2: Player
  odds: { p1: number; p2: number }
  h2h: { p1Wins: number; p2Wins: number; matches: H2HMatch[] }
  ai: AIPrediction
}

export type LiveMatch = Match & {
  server: 1 | 2
  currentSet: number
  sets: SetScore[]
  gameScore: { p1: string; p2: string } // e.g. "40", "30"
  status: string // e.g. "Set 2 · 3rd game"
}

export type ResultMatch = Match & {
  sets: SetScore[]
  winner: 1 | 2
  aiCorrect: boolean
  duration: string
}

export type Tournament<T> = {
  id: string
  name: string
  surface: SurfaceKey
  category: "ATP" | "WTA"
  matches: T[]
}

const mkForm = (s: string): FormResult[] => s.split("") as FormResult[]

// Helper to build a recent-form list from a compact string like "WGrassLHardWClay".
// Pairs of (result)(surface) are parsed into FormEntry records.
const mkFormMatches = (s: string, opponents: string[]): FormEntry[] => {
  const entries: FormEntry[] = []
  for (let i = 0; i < s.length; i += 2) {
    const result = s[i] as FormResult
    const surface = s[i + 1] === "H" ? "Hard" : s[i + 1] === "C" ? "Clay" : "Grass"
    entries.push({ result, surface, opponent: opponents[i / 2] ?? "" })
  }
  return entries
}

const mkSurfaceStats = (
  hard: [number, number, number],
  clay: [number, number, number],
  grass: [number, number, number],
): Record<SurfaceKey, SurfaceStat> => ({
  Hard: { winRate: hard[0], yearRecord: { wins: hard[1], losses: hard[2] } },
  Clay: { winRate: clay[0], yearRecord: { wins: clay[1], losses: clay[2] } },
  Grass: { winRate: grass[0], yearRecord: { wins: grass[1], losses: grass[2] } },
})

/* ------------------------------ LOCALIZATION ------------------------------ */

// Display labels for court surfaces. The internal keys stay in English so that
// styling and filtering keep working, while the UI always shows Mongolian.
export const surfaceLabels: Record<SurfaceKey, string> = {
  Hard: "Хард",
  Clay: "Шороон",
  Grass: "Зүлэг",
}

export const surfaceFilters: { key: "all" | SurfaceKey; label: string }[] = [
  { key: "all", label: "Бүгд" },
  { key: "Hard", label: "Хард" },
  { key: "Clay", label: "Шороон" },
  { key: "Grass", label: "Зүлэг" },
]

// Top banner stat.
export const aiAccuracy = { pct: 78.5, sample: 100 }

export const dateOptions = ["Өчигдөр", "Өнөөдөр", "Маргааш"] as const

/* -------------------------------- PRE-MATCH ------------------------------- */

export const preMatch: Tournament<Match>[] = [
  {
    id: "wimbledon",
    name: "ATP Wimbledon",
    surface: "Grass",
    category: "ATP",
    matches: [
      {
        id: "pm1",
        time: "13:30",
        surface: "Grass",
        p1: {
          name: "C. Alcaraz",
          country: "ESP",
          rank: 2,
          seed: 2,
          form: mkForm("WWWLW"),
          formMatches: mkFormMatches("WGLCWHG", ["T. Fritz", "N. Djokovic", "A. Zverev", "D. Medvedev", "J. Sinner"]),
          surfaceStats: mkSurfaceStats([74, 18, 5], [88, 22, 2], [82, 11, 2]),
        },
        p2: {
          name: "T. Fritz",
          country: "USA",
          rank: 11,
          seed: 11,
          form: mkForm("WLWWW"),
          formMatches: mkFormMatches("LHWHWGWH", ["A. Zverev", "C. Alcaraz", "H. Hurkacz", "D. Medvedev", "J. Sinner"]),
          surfaceStats: mkSurfaceStats([68, 14, 6], [42, 5, 3], [65, 9, 4]),
        },
        odds: { p1: 1.32, p2: 3.45 },
        h2h: {
          p1Wins: 4,
          p2Wins: 1,
          matches: [
            { year: "2024", tournament: "US Open", surface: "Hard", round: "1/4 финал", winner: "C. Alcaraz", score: "6-3 7-6 6-4" },
            { year: "2024", tournament: "Indian Wells", surface: "Hard", round: "Финал", winner: "C. Alcaraz", score: "7-6 6-1" },
            { year: "2023", tournament: "Wimbledon", surface: "Grass", round: "1/4 финал", winner: "C. Alcaraz", score: "6-4 6-3 6-4" },
            { year: "2023", tournament: "Queen's Club", surface: "Grass", round: "1/2 финал", winner: "T. Fritz", score: "7-6 6-4" },
            { year: "2022", tournament: "Cincinnati", surface: "Hard", round: "1/8 финал", winner: "C. Alcaraz", score: "6-3 6-2" },
          ],
        },
        ai: {
          predictedWinner: "C. Alcaraz",
          winProbability: 74,
          summary:
            "Alcaraz-ийн зүлгэн дээрх хөдөлгөөн болон хүлээн авалтын гүн түүнд тодорхой давуу тал өгч байна. Fritz-ийн серв өрсөлдөхүйц ч түүхэн Alcaraz-ыг эвдэж чадаагүй.",
          keyFactors: ["Сүүлийн 3 зүлгэн тулаанд хожсон", "1-р серв хүлээн авалт өндөр", "Брейк-цэгийн ашиглалт сайн"],
        },
      },
      {
        id: "pm2",
        time: "15:00",
        surface: "Grass",
        p1: {
          name: "A. Zverev",
          country: "GER",
          rank: 4,
          seed: 4,
          form: mkForm("WWLWW"),
          formMatches: mkFormMatches("WCLWHGWC", ["R. Nadal", "C. Alcaraz", "D. Medvedev", "T. Fritz", "J. Sinner"]),
          surfaceStats: mkSurfaceStats([71, 16, 4], [80, 20, 3], [58, 7, 5]),
        },
        p2: {
          name: "H. Hurkacz",
          country: "POL",
          rank: 9,
          seed: 9,
          form: mkForm("WWWWL"),
          formMatches: mkFormMatches("WGWHWHWL", ["T. Fritz", "A. Zverev", "D. Medvedev", "J. Sinner", "C. Alcaraz"]),
          surfaceStats: mkSurfaceStats([64, 12, 7], [35, 4, 4], [78, 11, 3]),
        },
        odds: { p1: 1.75, p2: 2.05 },
        h2h: {
          p1Wins: 3,
          p2Wins: 3,
          matches: [
            { year: "2024", tournament: "Rome", surface: "Clay", round: "1/2 финал", winner: "A. Zverev", score: "6-4 7-5" },
            { year: "2023", tournament: "Halle", surface: "Grass", round: "Финал", winner: "H. Hurkacz", score: "7-6 7-6" },
            { year: "2023", tournament: "Miami", surface: "Hard", round: "1/4 финал", winner: "A. Zverev", score: "6-3 6-4" },
            { year: "2022", tournament: "Wimbledon", surface: "Grass", round: "1/8 финал", winner: "H. Hurkacz", score: "6-7 7-6 6-4 6-4" },
          ],
        },
        ai: {
          predictedWinner: "H. Hurkacz",
          winProbability: 56,
          summary:
            "Бараг тэнцүү тулаан. Hurkacz-ийн зүлгэн туршлага болон түвшний өндөр серв энэ хурдан талбайд загварыг бага зэрэг түүн тал руу хазайлгаж байна.",
          keyFactors: ["Зүлгэн хожлын хувь 78%", "Тоглолт тутмын эйсээр тэргүүлдэг", "Сүүлийн зүлгэн тулаанд хожсон"],
        },
      },
    ],
  },
  {
    id: "indianwells-wta",
    name: "WTA Indian Wells",
    surface: "Hard",
    category: "WTA",
    matches: [
      {
        id: "pm3",
        time: "18:00",
        surface: "Hard",
        p1: {
          name: "I. Swiatek",
          country: "POL",
          rank: 1,
          seed: 1,
          form: mkForm("WWWWW"),
          formMatches: mkFormMatches("WCWHWCWH", ["A. Sabalenka", "C. Gauff", "E. Rybakina", "J. Pegula", "M. Keys"]),
          surfaceStats: mkSurfaceStats([76, 19, 4], [92, 24, 1], [55, 6, 4]),
        },
        p2: {
          name: "C. Gauff",
          country: "USA",
          rank: 3,
          seed: 3,
          form: mkForm("WWLWW"),
          formMatches: mkFormMatches("WHWLWHWH", ["E. Rybakina", "I. Swiatek", "J. Pegula", "M. Keys", "A. Sabalenka"]),
          surfaceStats: mkSurfaceStats([70, 15, 6], [48, 6, 5], [50, 5, 5]),
        },
        odds: { p1: 1.55, p2: 2.45 },
        h2h: {
          p1Wins: 11,
          p2Wins: 1,
          matches: [
            { year: "2024", tournament: "Roland Garros", surface: "Clay", round: "1/2 финал", winner: "I. Swiatek", score: "6-2 6-4" },
            { year: "2024", tournament: "Beijing", surface: "Hard", round: "Финал", winner: "C. Gauff", score: "6-3 4-6 6-3" },
            { year: "2023", tournament: "WTA Finals", surface: "Hard", round: "Групп", winner: "I. Swiatek", score: "6-3 6-2" },
            { year: "2023", tournament: "Dubai", surface: "Hard", round: "1/2 финал", winner: "I. Swiatek", score: "6-4 6-2" },
          ],
        },
        ai: {
          predictedWinner: "I. Swiatek",
          winProbability: 68,
          summary:
            "Swiatek хоорондын тулаанд давамгайлж, таван ялалтын цуваатай ирж байна. Gauff-ийн сайжирсан серв гол аюул ч топспингийн тулаан Swiatek-т таатай.",
          keyFactors: ["Тулаанд 11-1 тэргүүлдэг", "5 тоглолтын ялалтын цуваа", "Суурь шугамын тогтвортой байдал"],
        },
      },
    ],
  },
]

/* ---------------------------------- LIVE ---------------------------------- */

export const liveMatches: Tournament<LiveMatch>[] = [
  {
    id: "wimbledon-live",
    name: "ATP Wimbledon",
    surface: "Grass",
    category: "ATP",
    matches: [
      {
        id: "lv1",
        time: "12:00",
        surface: "Grass",
        server: 1,
        currentSet: 3,
        sets: [
          { p1: 6, p2: 4 },
          { p1: 4, p2: 6 },
          { p1: 3, p2: 2 },
        ],
        gameScore: { p1: "40", p2: "30" },
        status: "3-р сет · Sinner серв хийж байна",
        p1: {
          name: "J. Sinner",
          country: "ITA",
          rank: 1,
          seed: 1,
          form: mkForm("WWWWW"),
          formMatches: mkFormMatches("WHWHWHWH", ["C. Alcaraz", "D. Medvedev", "A. Zverev", "T. Fritz", "N. Djokovic"]),
          surfaceStats: mkSurfaceStats([80, 20, 3], [60, 8, 4], [70, 9, 3]),
        },
        p2: {
          name: "N. Djokovic",
          country: "SRB",
          rank: 5,
          seed: 5,
          form: mkForm("WWLWW"),
          formMatches: mkFormMatches("WGWHWLWG", ["C. Alcaraz", "A. Zverev", "J. Sinner", "D. Medvedev", "T. Fritz"]),
          surfaceStats: mkSurfaceStats([77, 17, 5], [75, 12, 3], [84, 12, 2]),
        },
        odds: { p1: 1.6, p2: 2.35 },
        h2h: {
          p1Wins: 4,
          p2Wins: 4,
          matches: [
            { year: "2024", tournament: "Wimbledon", surface: "Grass", round: "1/2 финал", winner: "N. Djokovic", score: "6-3 6-4 7-6" },
            { year: "2024", tournament: "Australian Open", surface: "Hard", round: "1/2 финал", winner: "J. Sinner", score: "6-1 6-2 6-7 6-3" },
          ],
        },
        ai: {
          predictedWinner: "J. Sinner",
          winProbability: 61,
          summary: "Sinner-ийн хавтгай бөмбөгний зам зүлгэн дээр үр дүнтэй байгаа нь батлагдаж байна. Шийдвэрлэх сетэд импульс шилжиж байна.",
          keyFactors: ["1-р серв хувь өндөр", "Суурь шугамын ралли хождог", "Албадлагагүй алдаа бага"],
        },
      },
      {
        id: "lv2",
        time: "12:30",
        surface: "Grass",
        server: 2,
        currentSet: 2,
        sets: [
          { p1: 7, p2: 6, p1tb: 7, p2tb: 5 },
          { p1: 2, p2: 1 },
        ],
        gameScore: { p1: "15", p2: "30" },
        status: "2-р сет · Rune серв хийж байна",
        p1: {
          name: "D. Medvedev",
          country: "RUS",
          rank: 6,
          seed: 6,
          form: mkForm("WLWWL"),
          formMatches: mkFormMatches("WHWLWHWL", ["A. Zverev", "C. Alcaraz", "H. Hurkacz", "T. Fritz", "H. Rune"]),
          surfaceStats: mkSurfaceStats([73, 18, 6], [55, 7, 5], [60, 8, 4]),
        },
        p2: {
          name: "H. Rune",
          country: "DEN",
          rank: 12,
          seed: 12,
          form: mkForm("WWWLL"),
          formMatches: mkFormMatches("WCWHWLLH", ["A. Zverev", "C. Alcaraz", "T. Fritz", "D. Medvedev", "J. Sinner"]),
          surfaceStats: mkSurfaceStats([62, 13, 7], [70, 14, 4], [58, 7, 5]),
        },
        odds: { p1: 1.45, p2: 2.75 },
        h2h: {
          p1Wins: 3,
          p2Wins: 2,
          matches: [
            { year: "2023", tournament: "Rome", surface: "Clay", round: "Финал", winner: "D. Medvedev", score: "7-5 7-5" },
          ],
        },
        ai: {
          predictedWinner: "D. Medvedev",
          winProbability: 65,
          summary: "Medvedev эхний сетийг тай-брейкээр авч, Rune-ийн форхэндийг сайн саармагжуулж байна.",
          keyFactors: ["1-р сетийн тай-брейк хожсон", "Хүчтэй хүлээн авалтын гэйм", "Тай-брейкийн амжилт сайн"],
        },
      },
    ],
  },
  {
    id: "indianwells-live",
    name: "WTA Indian Wells",
    surface: "Hard",
    category: "WTA",
    matches: [
      {
        id: "lv3",
        time: "13:15",
        surface: "Hard",
        server: 1,
        currentSet: 1,
        sets: [{ p1: 5, p2: 3 }],
        gameScore: { p1: "30", p2: "15" },
        status: "1-р сет · Sabalenka серв хийж байна",
        p1: {
          name: "A. Sabalenka",
          country: "BLR",
          rank: 2,
          seed: 2,
          form: mkForm("WWWWL"),
          formMatches: mkFormMatches("WHWHWHLH", ["I. Swiatek", "C. Gauff", "E. Rybakina", "J. Pegula", "M. Keys"]),
          surfaceStats: mkSurfaceStats([75, 17, 5], [60, 8, 4], [62, 7, 4]),
        },
        p2: {
          name: "E. Rybakina",
          country: "KAZ",
          rank: 4,
          seed: 4,
          form: mkForm("WWLWW"),
          formMatches: mkFormMatches("WHWLWHWH", ["J. Pegula", "A. Sabalenka", "M. Keys", "C. Gauff", "I. Swiatek"]),
          surfaceStats: mkSurfaceStats([72, 16, 6], [65, 10, 3], [68, 8, 3]),
        },
        odds: { p1: 1.7, p2: 2.15 },
        h2h: {
          p1Wins: 5,
          p2Wins: 4,
          matches: [
            { year: "2024", tournament: "Brisbane", surface: "Hard", round: "Финал", winner: "E. Rybakina", score: "6-0 6-3" },
          ],
        },
        ai: {
          predictedWinner: "A. Sabalenka",
          winProbability: 58,
          summary: "Sabalenka эрт брейк авч форхэндээрээ тоглолтыг удирдаж байна.",
          keyFactors: ["Эрт брейк авсан", "Илүү оноо (winners)", "Идэвхтэй хүлээн авалтын байрлал"],
        },
      },
    ],
  },
]

/* --------------------------------- RESULTS -------------------------------- */

export const results: Tournament<ResultMatch>[] = [
  {
    id: "wimbledon-res",
    name: "ATP Wimbledon",
    surface: "Grass",
    category: "ATP",
    matches: [
      {
        id: "rs1",
        time: "11:00",
        surface: "Grass",
        duration: "2ц 41м",
        winner: 1,
        aiCorrect: true,
        sets: [
          { p1: 6, p2: 3 },
          { p1: 6, p2: 7, p1tb: 5, p2tb: 7 },
          { p1: 6, p2: 4 },
          { p1: 6, p2: 2 },
        ],
        p1: {
          name: "C. Alcaraz",
          country: "ESP",
          rank: 2,
          seed: 2,
          form: mkForm("WWWLW"),
          formMatches: mkFormMatches("WGWHWLG", ["T. Fritz", "N. Djokovic", "A. Zverev", "L. Musetti", "J. Sinner"]),
          surfaceStats: mkSurfaceStats([74, 18, 5], [88, 22, 2], [82, 11, 2]),
        },
        p2: {
          name: "L. Musetti",
          country: "ITA",
          rank: 15,
          seed: 15,
          form: mkForm("WLLWW"),
          formMatches: mkFormMatches("WCWLWHWG", ["A. Zverev", "D. Medvedev", "C. Alcaraz", "T. Fritz", "J. Sinner"]),
          surfaceStats: mkSurfaceStats([55, 9, 7], [80, 16, 3], [48, 6, 6]),
        },
        odds: { p1: 1.25, p2: 4.0 },
        h2h: { p1Wins: 3, p2Wins: 1, matches: [] },
        ai: {
          predictedWinner: "C. Alcaraz",
          winProbability: 79,
          summary: "Загвар зүлгэн дээрх давуу формыг харгалзан Alcaraz-ийг зөв дэмжсэн.",
          keyFactors: ["Зүлгэн мэргэжилтэн", "Тулаанд тэргүүлдэг"],
        },
      },
      {
        id: "rs2",
        time: "14:00",
        surface: "Grass",
        duration: "3ц 12м",
        winner: 2,
        aiCorrect: false,
        sets: [
          { p1: 4, p2: 6 },
          { p1: 6, p2: 4 },
          { p1: 6, p2: 7, p1tb: 4, p2tb: 7 },
          { p1: 3, p2: 6 },
        ],
        p1: {
          name: "A. Zverev",
          country: "GER",
          rank: 4,
          seed: 4,
          form: mkForm("WWLWL"),
          formMatches: mkFormMatches("WCLWHWLG", ["R. Nadal", "C. Alcaraz", "D. Medvedev", "B. Shelton", "J. Sinner"]),
          surfaceStats: mkSurfaceStats([71, 16, 4], [80, 20, 3], [58, 7, 5]),
        },
        p2: {
          name: "B. Shelton",
          country: "USA",
          rank: 14,
          seed: 14,
          form: mkForm("WWWWW"),
          formMatches: mkFormMatches("WHWHWHWG", ["T. Fritz", "A. Zverev", "D. Medvedev", "H. Hurkacz", "J. Sinner"]),
          surfaceStats: mkSurfaceStats([66, 13, 6], [40, 4, 4], [72, 10, 4]),
        },
        odds: { p1: 1.6, p2: 2.3 },
        h2h: { p1Wins: 2, p2Wins: 1, matches: [] },
        ai: {
          predictedWinner: "A. Zverev",
          winProbability: 63,
          summary: "Загвар Zverev-ийг дэмжсэн ч Shelton-ийн серв загварын таамгийг эвдсэн.",
          keyFactors: ["Өндөр байр", "Илүү туршлага"],
        },
      },
    ],
  },
  {
    id: "indianwells-res",
    name: "WTA Indian Wells",
    surface: "Hard",
    category: "WTA",
    matches: [
      {
        id: "rs3",
        time: "16:30",
        surface: "Hard",
        duration: "1ц 28м",
        winner: 1,
        aiCorrect: true,
        sets: [
          { p1: 6, p2: 2 },
          { p1: 6, p2: 3 },
        ],
        p1: {
          name: "I. Swiatek",
          country: "POL",
          rank: 1,
          seed: 1,
          form: mkForm("WWWWW"),
          formMatches: mkFormMatches("WCWHWCWH", ["A. Sabalenka", "C. Gauff", "E. Rybakina", "M. Keys", "J. Pegula"]),
          surfaceStats: mkSurfaceStats([76, 19, 4], [92, 24, 1], [55, 6, 4]),
        },
        p2: {
          name: "M. Keys",
          country: "USA",
          rank: 13,
          seed: 13,
          form: mkForm("LWWLW"),
          formMatches: mkFormMatches("LHWHWLWH", ["E. Rybakina", "J. Pegula", "I. Swiatek", "C. Gauff", "A. Sabalenka"]),
          surfaceStats: mkSurfaceStats([60, 12, 7], [45, 5, 5], [52, 5, 5]),
        },
        odds: { p1: 1.3, p2: 3.6 },
        h2h: { p1Wins: 4, p2Wins: 0, matches: [] },
        ai: {
          predictedWinner: "I. Swiatek",
          winProbability: 81,
          summary: "Энгийн таамаглал, төлөвлөгөөний дагуу биелсэн.",
          keyFactors: ["Төгс тулаан (H2H)", "Дэлхийн 1-р байр"],
        },
      },
    ],
  },
]
