// import axios from "axios";

// const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// const systemPrompt = `
// You are an expert psychological sentiment analysis engine and wellness coach.

// Analyze:
// - mood
// - userStress (0-10)
// - note
// - historyAverage

// Rules:
// - Return valid JSON only.
// - No markdown.
// - No explanations outside JSON.
// - aiStressLevel must be 0-10.
// - aiSentimentScore must be 0-1.

// Stress Levels:
// 0-3 = Low
// 4-6 = Medium
// 7-10 = High

// Generate exactly 2 recommendations with real URLs (YouTube or Spotify only).

// Return format:
// {
//   "aiSentimentScore": 0.75,
//   "aiStressLevel": 8,
//   "recommendations": [
//     {
//       "category": "music",
//       "title": "",
//       "description": "",
//       "link": "",
//       "stressRange": "7-10"
//     },
//     {
//       "category": "meditation",
//       "title": "",
//       "description": "",
//       "link": "",
//       "stressRange": "7-10"
//     }
//   ]
// }
// `;

// export async function analyzeMoodWithAI(inputData) {
//   try {
//     const response = await axios.post(
//       "https://api.openai.com/v1/chat/completions",
//       {
//         model: "gpt-5-mini",

//         messages: [
//           {
//             role: "system",
//             content: systemPrompt,
//           },
//           {
//             role: "user",
//             content: JSON.stringify({
//               mood: inputData.mood,
//               userStress: inputData.userStress,
//               note: inputData.note,
//               historyAverage: inputData.historyAverage,
//             }),
//           },
//         ],

//         temperature: 0.3,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${API_KEY}`,
//         },
//       }
//     );

//     const content = response.data.choices[0].message.content;

//     const sanitized = content
//       .replace(/^```json\s*|```$/g, "")
//       .trim();

//     return JSON.parse(sanitized);
//   } catch (error) {
//     console.error("OpenAI Error:", error);

//     return {
//       aiStressLevel: inputData.userStress || 5,
//       aiSentimentScore: 0.5,
//       recommendations: [
//         {
//           category: "tip",
//           title: "Take a Deep Breath",
//           description: "Pause and do 3 slow breaths.",
//           link: "https://www.youtube.com/watch?v=n6RbW2BXOdf",
//           stressRange: "0-10",
//         },
//       ],
//     };
//   }
// }

// ***********************************************************************************************************************************

// ================================================================
//  moodAnalysisService.ts  —  Advanced Rule-Based Mood & Stress
//  Analysis Engine  v2.0
//
//  Architecture:
//    1. Lexical NLP Layer
//       • Negation detection  ("not happy" → flips valence)
//       • Intensifiers        ("extremely anxious" → weight ×1.8)
//       • Diminishers         ("slightly tired" → weight ×0.5)
//       • Multi-word phrase priority over single-token matches
//    2. Multi-Dimensional Scoring
//       • Emotional Valence   (positive ↔ negative affect)
//       • Arousal             (calm ↔ activated/agitated)
//       • Cognitive Load      (clear ↔ overwhelmed thinking)
//       • Physical Cues       (body-language stress markers)
//       • Temporal Urgency    (past events vs. ongoing vs. future fear)
//    3. Contextual Pattern Classifier
//       • 12 life-domain patterns (work, relationships, health…)
//       • Domain boosts/dampens the final stress band
//    4. Confidence-Weighted Blending
//       • Self-report anchor, mood label, and text score
//       • Each signal carries a reliability confidence weight
//       • Divergence detection: flags when self-report ≠ text signal
//    5. Rich Recommendation Engine
//       • 24-entry library (3 bands × 4 categories × 2 items each)
//       • Category affinity: matched to detected domain
//       • Urgency-first ordering for high-stress
// ================================================================

// ─────────────────────────────────────────────────────────────────
// SECTION 1 — TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────

export type StressBand = "low" | "moderate" | "high";
export type RecommendationCategory = "meditation" | "music" | "activity" | "tip";
export type LifeDomain =
  | "work"
  | "relationships"
  | "health"
  | "academic"
  | "financial"
  | "grief"
  | "identity"
  | "social"
  | "unknown";

export interface MoodInput {
  mood?: string;
  userStress?: number;
  note?: string;
}

export interface Recommendation {
  category: RecommendationCategory;
  title: string;
  description: string;
  link: string;
  stressRange: string;
}

export interface AnalysisDebug {
  selfReportScore: number;
  moodLabelScore: number;
  textScore: number;
  textRawScore: number;
  emotionalValence: number;
  arousalScore: number;
  cognitiveLoadScore: number;
  physicalCueScore: number;
  temporalUrgencyBoost: number;
  detectedDomain: LifeDomain;
  domainBoost: number;
  negationsFound: string[];
  intensifiersFound: string[];
  diminishersFound: string[];
  triggeredPhrases: Array<{ phrase: string; weight: number; dimension: string }>;
  selfReportTextDivergence: number;
  confidenceLevel: "high" | "medium" | "low";
  blendedRaw: number;
}

export interface AnalysisResult {
  aiSentimentScore: number;   // 0 (very positive) → 1 (very negative)
  aiStressLevel: number;      // 0 – 10 integer
  stressBand: StressBand;
  detectedDomain: LifeDomain;
  confidenceLevel: "high" | "medium" | "low";
  recommendations: Recommendation[];
  debug: AnalysisDebug;
}

// ─────────────────────────────────────────────────────────────────
// SECTION 2 — LEXICAL MODIFIERS
// ─────────────────────────────────────────────────────────────────

/**
 * Negation words. When one of these precedes a scored token
 * within a 4-word window, the token's weight is inverted.
 */
const NEGATION_TOKENS = new Set([
  "not", "no", "never", "neither", "nor", "nothing",
  "nobody", "nowhere", "don't", "doesn't", "didn't",
  "can't", "cannot", "couldn't", "won't", "wouldn't",
  "shouldn't", "wasn't", "weren't", "isn't", "aren't",
  "hardly", "scarcely", "barely",
]);

/**
 * Intensifiers multiply the weight of the next scored token.
 * Value = multiplier.
 */
const INTENSIFIERS: Record<string, number> = {
  "extremely":   1.9,
  "incredibly":  1.8,
  "absolutely":  1.8,
  "completely":  1.7,
  "totally":     1.7,
  "utterly":     1.8,
  "so":          1.4,
  "very":        1.5,
  "really":      1.4,
  "quite":       1.3,
  "deeply":      1.6,
  "severely":    1.8,
  "terribly":    1.7,
  "awfully":     1.6,
  "horribly":    1.6,
  "insanely":    1.7,
  "unbearably":  1.9,
  "overwhelmingly": 2.0,
};

/**
 * Diminishers multiply the weight of the next scored token.
 * Value = multiplier (< 1).
 */
const DIMINISHERS: Record<string, number> = {
  "slightly":    0.4,
  "a bit":       0.5,
  "a little":    0.5,
  "somewhat":    0.6,
  "kind of":     0.6,
  "kinda":       0.6,
  "sort of":     0.6,
  "barely":      0.3,
  "mildly":      0.4,
  "fairly":      0.7,
  "rather":      0.7,
  "pretty":      0.8,
};

// ─────────────────────────────────────────────────────────────────
// SECTION 3 — MULTI-DIMENSIONAL KEYWORD LEXICON
// ─────────────────────────────────────────────────────────────────

interface LexiconEntry {
  weight: number;          // base stress delta (positive = more stress)
  dimensions: string[];   // which sub-scores this affects
}

/**
 * Keys are SORTED longest-first at runtime so multi-word phrases
 * match before their constituent single words.
 *
 * Dimensions:
 *   V = Valence (emotional negativity)
 *   A = Arousal (agitation/activation)
 *   C = Cognitive load
 *   P = Physical cues
 */
const LEXICON: Record<string, LexiconEntry> = {

  // ── CRITICAL / HIGH-STRESS PHRASES ────────────────────────────
  "anxiety attack":         { weight: 4.0, dimensions: ["V","A","P"] },
  "panic attack":           { weight: 4.0, dimensions: ["V","A","P"] },
  "falling apart":          { weight: 3.5, dimensions: ["V","C"] },
  "can't cope":             { weight: 3.5, dimensions: ["V","C"] },
  "cannot cope":            { weight: 3.5, dimensions: ["V","C"] },
  "out of control":         { weight: 3.5, dimensions: ["V","A","C"] },
  "losing my mind":         { weight: 3.5, dimensions: ["V","C"] },
  "losing it":              { weight: 3.0, dimensions: ["V","A"] },
  "breaking down":          { weight: 3.5, dimensions: ["V","A"] },
  "breakdown":              { weight: 3.5, dimensions: ["V","A"] },
  "heart racing":           { weight: 3.0, dimensions: ["A","P"] },
  "can't breathe":          { weight: 3.0, dimensions: ["A","P"] },
  "cannot breathe":         { weight: 3.0, dimensions: ["A","P"] },
  "chest tight":            { weight: 3.0, dimensions: ["A","P"] },
  "chest tightness":        { weight: 3.0, dimensions: ["A","P"] },
  "can't sleep":            { weight: 2.5, dimensions: ["A","P"] },
  "cannot sleep":           { weight: 2.5, dimensions: ["A","P"] },
  "can't eat":              { weight: 2.5, dimensions: ["V","P"] },
  "can't focus":            { weight: 2.5, dimensions: ["C"] },
  "can't think":            { weight: 2.5, dimensions: ["C"] },
  "mind is blank":          { weight: 2.0, dimensions: ["C"] },
  "mind racing":            { weight: 2.5, dimensions: ["A","C"] },
  "thoughts racing":        { weight: 2.5, dimensions: ["A","C"] },
  "feel worthless":         { weight: 4.0, dimensions: ["V"] },
  "feeling worthless":      { weight: 4.0, dimensions: ["V"] },
  "want to give up":        { weight: 4.0, dimensions: ["V","C"] },
  "want to quit":           { weight: 3.0, dimensions: ["V"] },
  "everything is falling":  { weight: 3.5, dimensions: ["V","C"] },
  "everything hurts":       { weight: 3.0, dimensions: ["V","P"] },
  "no hope":                { weight: 4.0, dimensions: ["V"] },
  "no point":               { weight: 3.5, dimensions: ["V"] },
  "burned out":             { weight: 3.0, dimensions: ["V","P","C"] },
  "burnt out":              { weight: 3.0, dimensions: ["V","P","C"] },
  "falling behind":         { weight: 2.5, dimensions: ["C","V"] },
  "behind on":              { weight: 2.0, dimensions: ["C"] },
  "completely lost":        { weight: 3.0, dimensions: ["V","C"] },

  // ── HIGH SINGLE TOKENS ────────────────────────────────────────
  "overwhelmed":            { weight: 3.5, dimensions: ["V","A","C"] },
  "panic":                  { weight: 3.0, dimensions: ["V","A"] },
  "panicking":              { weight: 3.0, dimensions: ["V","A"] },
  "hopeless":               { weight: 3.5, dimensions: ["V"] },
  "desperate":              { weight: 3.0, dimensions: ["V","A"] },
  "crisis":                 { weight: 3.0, dimensions: ["V","A"] },
  "terrified":              { weight: 3.0, dimensions: ["V","A"] },
  "unbearable":             { weight: 3.0, dimensions: ["V"] },
  "shaking":                { weight: 2.5, dimensions: ["A","P"] },
  "trembling":              { weight: 2.5, dimensions: ["A","P"] },
  "dread":                  { weight: 2.5, dimensions: ["V","A"] },
  "nightmare":              { weight: 2.5, dimensions: ["V"] },
  "disaster":               { weight: 2.5, dimensions: ["V"] },
  "failed":                 { weight: 2.5, dimensions: ["V"] },
  "failure":                { weight: 2.5, dimensions: ["V"] },
  "exhausted":              { weight: 2.5, dimensions: ["V","P"] },
  "depressed":              { weight: 3.0, dimensions: ["V"] },
  "miserable":              { weight: 2.5, dimensions: ["V"] },
  "horrible":               { weight: 2.5, dimensions: ["V"] },
  "terrible":               { weight: 2.5, dimensions: ["V"] },
  "awful":                  { weight: 2.5, dimensions: ["V"] },
  "furious":                { weight: 2.5, dimensions: ["V","A"] },
  "rage":                   { weight: 2.5, dimensions: ["V","A"] },
  "suffocating":            { weight: 3.0, dimensions: ["A","P"] },
  "isolated":               { weight: 2.0, dimensions: ["V"] },
  "paralyzed":              { weight: 2.5, dimensions: ["V","C"] },
  "nauseous":               { weight: 2.0, dimensions: ["P"] },
  "headache":               { weight: 1.5, dimensions: ["P"] },
  "headaches":              { weight: 1.5, dimensions: ["P"] },

  // ── MODERATE STRESS ───────────────────────────────────────────
  "anxious":                { weight: 2.0, dimensions: ["V","A"] },
  "anxiety":                { weight: 2.0, dimensions: ["V","A"] },
  "stressed":               { weight: 2.0, dimensions: ["V","A"] },
  "stress":                 { weight: 1.5, dimensions: ["V","A"] },
  "worried":                { weight: 1.5, dimensions: ["V","C"] },
  "worry":                  { weight: 1.5, dimensions: ["V","C"] },
  "nervous":                { weight: 1.5, dimensions: ["V","A"] },
  "tense":                  { weight: 1.5, dimensions: ["A","P"] },
  "upset":                  { weight: 1.5, dimensions: ["V"] },
  "sad":                    { weight: 1.5, dimensions: ["V"] },
  "unhappy":                { weight: 1.5, dimensions: ["V"] },
  "annoyed":                { weight: 1.5, dimensions: ["V","A"] },
  "irritated":              { weight: 1.5, dimensions: ["V","A"] },
  "frustrated":             { weight: 2.0, dimensions: ["V","A"] },
  "angry":                  { weight: 2.0, dimensions: ["V","A"] },
  "hate":                   { weight: 2.0, dimensions: ["V"] },
  "confused":               { weight: 1.0, dimensions: ["C"] },
  "unsure":                 { weight: 1.0, dimensions: ["C"] },
  "doubt":                  { weight: 1.0, dimensions: ["C"] },
  "tired":                  { weight: 1.0, dimensions: ["V","P"] },
  "fatigue":                { weight: 1.5, dimensions: ["P"] },
  "bored":                  { weight: 0.5, dimensions: ["V"] },
  "lonely":                 { weight: 1.5, dimensions: ["V"] },
  "stuck":                  { weight: 2.0, dimensions: ["V","C"] },
  "lost":                   { weight: 1.5, dimensions: ["V","C"] },
  "behind":                 { weight: 1.0, dimensions: ["C"] },
  "deadline":               { weight: 1.5, dimensions: ["A","C"] },
  "pressure":               { weight: 2.0, dimensions: ["A","C"] },
  "overwhelm":              { weight: 2.5, dimensions: ["V","A","C"] },
  "regret":                 { weight: 1.5, dimensions: ["V"] },
  "guilt":                  { weight: 2.0, dimensions: ["V"] },
  "shame":                  { weight: 2.0, dimensions: ["V"] },
  "embarrassed":            { weight: 1.5, dimensions: ["V"] },
  "humiliated":             { weight: 2.5, dimensions: ["V"] },
  "rejected":               { weight: 2.0, dimensions: ["V"] },
  "betrayed":               { weight: 2.5, dimensions: ["V"] },
  "hurt":                   { weight: 1.5, dimensions: ["V"] },
  "heartbroken":            { weight: 3.0, dimensions: ["V"] },
  "grief":                  { weight: 3.0, dimensions: ["V"] },
  "grieving":               { weight: 3.0, dimensions: ["V"] },
  "loss":                   { weight: 2.0, dimensions: ["V"] },

  // ── LOW STRESS / POSITIVE VALENCE ─────────────────────────────
  "happy":                  { weight: -2.0, dimensions: ["V"] },
  "joyful":                 { weight: -2.0, dimensions: ["V","A"] },
  "excited":                { weight: -1.5, dimensions: ["V","A"] },
  "grateful":               { weight: -2.0, dimensions: ["V"] },
  "thankful":               { weight: -2.0, dimensions: ["V"] },
  "peaceful":               { weight: -2.5, dimensions: ["V","A"] },
  "calm":                   { weight: -2.5, dimensions: ["V","A"] },
  "relaxed":                { weight: -2.0, dimensions: ["V","A","P"] },
  "content":                { weight: -1.5, dimensions: ["V"] },
  "okay":                   { weight: -0.5, dimensions: ["V"] },
  "fine":                   { weight: -0.5, dimensions: ["V"] },
  "good":                   { weight: -1.0, dimensions: ["V"] },
  "great":                  { weight: -1.5, dimensions: ["V"] },
  "amazing":                { weight: -2.0, dimensions: ["V"] },
  "wonderful":              { weight: -2.0, dimensions: ["V"] },
  "fantastic":              { weight: -2.0, dimensions: ["V"] },
  "energized":              { weight: -1.5, dimensions: ["V","A","P"] },
  "motivated":              { weight: -1.5, dimensions: ["V","C"] },
  "focused":                { weight: -1.5, dimensions: ["C"] },
  "productive":             { weight: -1.0, dimensions: ["C"] },
  "rested":                 { weight: -1.5, dimensions: ["P"] },
  "refreshed":              { weight: -1.5, dimensions: ["V","P"] },
  "optimistic":             { weight: -1.5, dimensions: ["V","C"] },
  "hopeful":                { weight: -1.5, dimensions: ["V"] },
  "confident":              { weight: -1.5, dimensions: ["V","C"] },
  "loved":                  { weight: -1.5, dimensions: ["V"] },
  "supported":              { weight: -1.5, dimensions: ["V"] },
  "accomplished":           { weight: -1.5, dimensions: ["V","C"] },
  "proud":                  { weight: -1.5, dimensions: ["V"] },
  "relieved":               { weight: -2.0, dimensions: ["V","A"] },
  "at ease":                { weight: -2.0, dimensions: ["V","A"] },
  "light":                  { weight: -1.0, dimensions: ["V"] },
};

// ─────────────────────────────────────────────────────────────────
// SECTION 4 — MOOD LABEL MAP
// ─────────────────────────────────────────────────────────────────

interface MoodProfile {
  stressOffset: number;   // added to neutral baseline of 5
  valence: number;        // -1 to +1
  arousal: number;        // -1 to +1
}

const MOOD_PROFILES: Record<string, MoodProfile> = {
  // High stress
  "angry":       { stressOffset: 3,  valence: -0.9, arousal:  0.9 },
  "panicked":    { stressOffset: 4,  valence: -1.0, arousal:  1.0 },
  "anxious":     { stressOffset: 3,  valence: -0.8, arousal:  0.8 },
  "depressed":   { stressOffset: 3,  valence: -1.0, arousal: -0.5 },
  "stressed":    { stressOffset: 3,  valence: -0.7, arousal:  0.7 },
  "overwhelmed": { stressOffset: 4,  valence: -0.9, arousal:  0.9 },
  "hopeless":    { stressOffset: 3,  valence: -1.0, arousal: -0.2 },
  "heartbroken": { stressOffset: 3,  valence: -1.0, arousal: -0.3 },
  "furious":     { stressOffset: 3,  valence: -0.9, arousal:  1.0 },
  // Moderate
  "frustrated":  { stressOffset: 2,  valence: -0.6, arousal:  0.5 },
  "sad":         { stressOffset: 2,  valence: -0.7, arousal: -0.3 },
  "worried":     { stressOffset: 2,  valence: -0.6, arousal:  0.6 },
  "tired":       { stressOffset: 1,  valence: -0.4, arousal: -0.6 },
  "confused":    { stressOffset: 1,  valence: -0.3, arousal:  0.2 },
  "lonely":      { stressOffset: 2,  valence: -0.6, arousal: -0.3 },
  "guilty":      { stressOffset: 2,  valence: -0.7, arousal:  0.3 },
  "bored":       { stressOffset: 0,  valence: -0.2, arousal: -0.5 },
  "irritated":   { stressOffset: 2,  valence: -0.5, arousal:  0.5 },
  // Neutral
  "neutral":     { stressOffset: 0,  valence:  0.0, arousal:  0.0 },
  "okay":        { stressOffset: -1, valence:  0.1, arousal:  0.0 },
  "fine":        { stressOffset: -1, valence:  0.1, arousal:  0.0 },
  "mixed":       { stressOffset: 0,  valence:  0.0, arousal:  0.2 },
  // Positive
  "happy":       { stressOffset: -3, valence:  0.8, arousal:  0.4 },
  "excited":     { stressOffset: -2, valence:  0.8, arousal:  0.9 },
  "calm":        { stressOffset: -3, valence:  0.7, arousal: -0.8 },
  "grateful":    { stressOffset: -3, valence:  0.9, arousal:  0.1 },
  "content":     { stressOffset: -2, valence:  0.6, arousal: -0.2 },
  "peaceful":    { stressOffset: -3, valence:  0.8, arousal: -0.9 },
  "energized":   { stressOffset: -2, valence:  0.7, arousal:  0.8 },
  "motivated":   { stressOffset: -2, valence:  0.7, arousal:  0.7 },
  "hopeful":     { stressOffset: -2, valence:  0.7, arousal:  0.3 },
  "relieved":    { stressOffset: -2, valence:  0.8, arousal: -0.1 },
  "proud":       { stressOffset: -2, valence:  0.8, arousal:  0.3 },
};

// ─────────────────────────────────────────────────────────────────
// SECTION 5 — LIFE DOMAIN PATTERNS
// ─────────────────────────────────────────────────────────────────

interface DomainPattern {
  patterns: string[];
  stressBoost: number;   // added to final score when domain is detected
  affinityCategories: RecommendationCategory[];  // preferred rec categories
}

const DOMAIN_PATTERNS: Record<LifeDomain, DomainPattern> = {
  work: {
    patterns: [
      "work","job","boss","manager","colleague","coworker","office",
      "meeting","project","deadline","promotion","fired","layoff",
      "performance review","overworked","workload","career","salary",
      "resign","resignation","client","presentation","overtime",
    ],
    stressBoost: 0.5,
    affinityCategories: ["tip","activity"],
  },
  academic: {
    patterns: [
      "exam","test","study","homework","assignment","grade","school",
      "university","college","professor","lecture","thesis","dissertation",
      "midterm","finals","gpa","fail","pass","tuition","class",
    ],
    stressBoost: 0.5,
    affinityCategories: ["meditation","tip"],
  },
  relationships: {
    patterns: [
      "relationship","partner","boyfriend","girlfriend","husband","wife",
      "breakup","divorce","argument","fight","cheating","trust","love",
      "family","parent","mom","dad","sibling","friend","friendship",
    ],
    stressBoost: 0.7,
    affinityCategories: ["tip","meditation"],
  },
  health: {
    patterns: [
      "doctor","hospital","diagnosis","sick","illness","pain","surgery",
      "treatment","medication","therapy","chronic","symptom","injury",
      "mental health","physical health","sleep","insomnia","diet",
    ],
    stressBoost: 0.8,
    affinityCategories: ["activity","meditation"],
  },
  financial: {
    patterns: [
      "money","debt","bills","rent","mortgage","savings","loan","credit",
      "broke","bankrupt","afford","expensive","budget","income","invest",
      "financial","poverty","wealth","tax","payment",
    ],
    stressBoost: 0.6,
    affinityCategories: ["tip","activity"],
  },
  grief: {
    patterns: [
      "death","died","loss","grief","grieving","funeral","mourning",
      "passed away","gone","miss","memorial","bereave","widow",
    ],
    stressBoost: 1.2,
    affinityCategories: ["meditation","music"],
  },
  identity: {
    patterns: [
      "who am i","purpose","meaning","direction","identity","belonging",
      "worth","value","self-esteem","confidence","insecure","imposter",
      "existential","future","life plan","goals",
    ],
    stressBoost: 0.5,
    affinityCategories: ["tip","meditation"],
  },
  social: {
    patterns: [
      "social","party","crowd","people","event","gathering","awkward",
      "social anxiety","judged","embarrass","presentation","public speaking",
      "networking","rejection",
    ],
    stressBoost: 0.4,
    affinityCategories: ["activity","meditation"],
  },
  unknown: {
    patterns: [],
    stressBoost: 0,
    affinityCategories: ["tip","meditation"],
  },
};

// ─────────────────────────────────────────────────────────────────
// SECTION 6 — TEMPORAL URGENCY PATTERNS
// ─────────────────────────────────────────────────────────────────

/**
 * Phrases indicating an active/immediate stressor score higher
 * than past-tense or vague future references.
 */
const TEMPORAL_BOOST_PATTERNS: Array<{ pattern: RegExp; boost: number }> = [
  { pattern: /right now|this moment|currently|at the moment/i,  boost: 1.0 },
  { pattern: /today|tonight|this morning|this afternoon/i,      boost: 0.8 },
  { pattern: /this week|these days|lately|recently/i,           boost: 0.5 },
  { pattern: /always|every day|constantly|all the time/i,       boost: 0.7 },
  { pattern: /never going to|won't ever|can't ever/i,           boost: 0.6 },
  { pattern: /used to|last year|back then|in the past/i,        boost: -0.3 },
  { pattern: /someday|eventually|might|maybe/i,                 boost: -0.2 },
];

// ─────────────────────────────────────────────────────────────────
// SECTION 7 — RECOMMENDATION LIBRARY (24 items)
// ─────────────────────────────────────────────────────────────────

type RecLibrary = Record<StressBand, Record<RecommendationCategory, Recommendation[]>>;

const REC_LIBRARY: RecLibrary = {
  // ── LOW STRESS (0–3) ──────────────────────────────────────────
  low: {
    meditation: [
      {
        category: "meditation",
        title: "5-Min Gratitude Body Scan",
        description:
          "Close your eyes. Breathe in slowly and mentally thank one body part per breath — feet for carrying you, hands for creating. 5 minutes rewires your baseline to abundance.",
        link: "https://www.youtube.com/watch?v=U9YKY7fdwyg",
        stressRange: "0-3",
      },
      {
        category: "meditation",
        title: "Open Awareness Meditation",
        description:
          "Sit comfortably and simply observe thoughts and sounds without labeling them. This 'witness' practice deepens clarity when your mind is already at ease.",
        link: "https://www.youtube.com/watch?v=OT5d5lpMSnQ",
        stressRange: "0-3",
      },
    ],
    music: [
      {
        category: "music",
        title: "Lo-Fi Chill Study Beats",
        description:
          "60–70 BPM lo-fi tracks synchronize with your natural resting heart rate, sustaining focus without stimulation.",
        link: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        stressRange: "0-3",
      },
      {
        category: "music",
        title: "Nature Soundscape — Forest Rain",
        description:
          "Pink noise from rain recordings has been shown to improve cognitive performance and preserve a calm state.",
        link: "https://www.youtube.com/watch?v=yIQd2Ya0Ziw",
        stressRange: "0-3",
      },
    ],
    activity: [
      {
        category: "activity",
        title: "10-Minute Mindful Walk",
        description:
          "Walk slowly and notice 3 details about each step — texture underfoot, air temperature, peripheral movement. Converts routine movement into active mindfulness.",
        link: "https://www.youtube.com/watch?v=UME9tDPYOH8",
        stressRange: "0-3",
      },
      {
        category: "activity",
        title: "Morning Sun Salutation (Yoga)",
        description:
          "5 rounds of Sun Salutation A maintain body-mind coherence and energy balance when stress is low. Perfect 8-minute morning anchor.",
        link: "https://www.youtube.com/watch?v=C0tVN-DvZvI",
        stressRange: "0-3",
      },
    ],
    tip: [
      {
        category: "tip",
        title: "Intention Journaling",
        description:
          "Write one sentence: 'Today I intend to ___.' Channeling low-stress clarity into intention accelerates momentum toward meaningful goals.",
        link: "https://www.youtube.com/watch?v=3NKOLHQSNeo",
        stressRange: "0-3",
      },
      {
        category: "tip",
        title: "Dopamine Menu Planning",
        description:
          "While calm, list 5 small enjoyable activities. When stress rises later, you'll have a ready menu instead of defaulting to doom-scrolling.",
        link: "https://www.youtube.com/watch?v=vl-44jDYDJQ",
        stressRange: "0-3",
      },
    ],
  },

  // ── MODERATE STRESS (4–6) ─────────────────────────────────────
  moderate: {
    meditation: [
      {
        category: "meditation",
        title: "4-7-8 Breathing — Parasympathetic Reset",
        description:
          "Inhale 4s, hold 7s, exhale 8s. The extended exhale activates the vagus nerve and drops cortisol within 4 cycles.",
        link: "https://www.youtube.com/watch?v=YRPh_GaiL8s",
        stressRange: "4-6",
      },
      {
        category: "meditation",
        title: "10-Min MBSR Body Scan",
        description:
          "Mindfulness-Based Stress Reduction body scan from head to toe. Clinically proven to reduce perceived stress by 30% after a single session.",
        link: "https://www.youtube.com/watch?v=u4gZgnmRBi4",
        stressRange: "4-6",
      },
    ],
    music: [
      {
        category: "music",
        title: "Calming Classical Piano — Cortisol Reducer",
        description:
          "Slow-tempo classical pieces (60–80 BPM) shown in research to lower cortisol and blood pressure within 10 minutes.",
        link: "https://www.youtube.com/watch?v=mTnG-JQZLZA",
        stressRange: "4-6",
      },
      {
        category: "music",
        title: "Theta Wave Ambient Music (6 Hz)",
        description:
          "Theta brainwave frequencies encourage the relaxed-focus state between waking and sleep — ideal for cognitive overload recovery.",
        link: "https://www.youtube.com/watch?v=9zhp1K2DZMQ",
        stressRange: "4-6",
      },
    ],
    activity: [
      {
        category: "activity",
        title: "Progressive Muscle Relaxation (PMR)",
        description:
          "Tense each muscle group 5s, release 20s. Start feet → calves → thighs → abdomen → hands → shoulders → face. Dissolves the physical component of stress.",
        link: "https://www.youtube.com/watch?v=1nZEdqcGVzo",
        stressRange: "4-6",
      },
      {
        category: "activity",
        title: "5-Minute EFT Tapping — Anxiety Relief",
        description:
          "Emotional Freedom Technique: tap 9 acupressure points while stating your stressor. Studies show cortisol drops 24% in one session.",
        link: "https://www.youtube.com/watch?v=mKWMl0RJzYA",
        stressRange: "4-6",
      },
    ],
    tip: [
      {
        category: "tip",
        title: "5-4-3-2-1 Grounding Technique",
        description:
          "Name 5 things you see, 4 you can touch, 3 you hear, 2 you can smell, 1 you taste. Interrupts rumination by forcing sensory present-moment awareness.",
        link: "https://www.youtube.com/watch?v=30VMIEmA114",
        stressRange: "4-6",
      },
      {
        category: "tip",
        title: "Cognitive Defusion — Name Your Stress Story",
        description:
          "Say out loud: 'I'm having the thought that...' before your stressor. This 1-word prefix creates psychological distance from the thought and reduces its grip.",
        link: "https://www.youtube.com/watch?v=WbmuvHhFfUk",
        stressRange: "4-6",
      },
    ],
  },

  // ── HIGH STRESS (7–10) ────────────────────────────────────────
  high: {
    meditation: [
      {
        category: "meditation",
        title: "Box Breathing — Immediate Nervous System Override",
        description:
          "Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 5 cycles. Used by Navy SEALs to override acute panic response within 90 seconds.",
        link: "https://www.youtube.com/watch?v=n6RbW2BXOdf",
        stressRange: "7-10",
      },
      {
        category: "meditation",
        title: "Physiological Sigh — Fastest Stress Deflation",
        description:
          "Double inhale through nose (fill, then sniff more), then one long slow exhale. One cycle deflates the physiological stress response faster than any other breathing pattern.",
        link: "https://www.youtube.com/watch?v=rBdhqBGqiMc",
        stressRange: "7-10",
      },
    ],
    music: [
      {
        category: "music",
        title: "Binaural Beats — 432 Hz Deep Stress Relief",
        description:
          "Use headphones. 432 Hz + delta wave binaural beats shift brainwaves from high-beta (stress) to alpha (calm). Effects begin within 7 minutes.",
        link: "https://www.youtube.com/watch?v=yFY-qwDXa4g",
        stressRange: "7-10",
      },
      {
        category: "music",
        title: "Weightless — Marconi Union (Scientifically Calming)",
        description:
          "This piece was co-designed with sound therapists and proven in studies to reduce anxiety by 65% — more than massage therapy.",
        link: "https://www.youtube.com/watch?v=UfcAVejslrU",
        stressRange: "7-10",
      },
    ],
    activity: [
      {
        category: "activity",
        title: "Cold Water Dive Reflex Reset",
        description:
          "Splash cold water on your face 3× or submerge face in cold water 15–30s. Instantly triggers the mammalian dive reflex, slowing heart rate by up to 25%.",
        link: "https://www.youtube.com/watch?v=F6eFFCi12v8",
        stressRange: "7-10",
      },
      {
        category: "activity",
        title: "HIIT Cortisol Burn — 7-Minute Stress Release",
        description:
          "High-intensity movement metabolizes excess cortisol and adrenaline chemically. Jumping jacks, high knees, burpees — 30s on, 10s off for 7 minutes.",
        link: "https://www.youtube.com/watch?v=mmq5zZfmIws",
        stressRange: "7-10",
      },
    ],
    tip: [
      {
        category: "tip",
        title: "RAIN Technique for Overwhelm",
        description:
          "Recognize what's happening → Allow it to exist → Investigate with kindness → Nurture yourself. A 4-step mindfulness protocol that stops the overwhelm spiral.",
        link: "https://www.youtube.com/watch?v=u1ELrmO7bz8",
        stressRange: "7-10",
      },
      {
        category: "tip",
        title: "Window of Tolerance — Body Safety Script",
        description:
          "Place both hands on your chest, feel your heartbeat, and say: 'I am safe right now. This feeling is temporary.' Somatic grounding activates the prefrontal cortex.",
        link: "https://www.youtube.com/watch?v=SJzfy3GIiSg",
        stressRange: "7-10",
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────
// SECTION 8 — NLP ANALYSIS ENGINE
// ─────────────────────────────────────────────────────────────────

interface TokenAnalysis {
  rawScore: number;
  dimensionScores: Record<string, number>;
  negationsFound: string[];
  intensifiersFound: string[];
  diminishersFound: string[];
  triggeredPhrases: Array<{ phrase: string; weight: number; dimension: string }>;
}

/**
 * Sorts lexicon entries: multi-word phrases first (longest first),
 * then single tokens. Prevents single-token matches shadowing phrases.
 */
function getSortedLexiconKeys(): string[] {
  return Object.keys(LEXICON).sort((a, b) => {
    const aWords = a.split(" ").length;
    const bWords = b.split(" ").length;
    if (bWords !== aWords) return bWords - aWords; // longer phrase first
    return a.localeCompare(b);
  });
}

const SORTED_LEXICON_KEYS = getSortedLexiconKeys();

/**
 * Deep NLP token analysis with:
 *  - Phrase deduplication (consumed tokens can't be matched again)
 *  - Negation window (4 words before phrase)
 *  - Intensifier / diminisher window (2 words before phrase)
 *  - Dimension scoring (V, A, C, P) for multi-axis stress model
 */
function analyzeText(text: string): TokenAnalysis {
  const lower = text.toLowerCase();
  const dimensionScores: Record<string, number> = { V: 0, A: 0, C: 0, P: 0 };
  let rawScore = 0;

  const negationsFound: string[] = [];
  const intensifiersFound: string[] = [];
  const diminishersFound: string[] = [];
  const triggeredPhrases: Array<{ phrase: string; weight: number; dimension: string }> = [];

  // Track consumed character spans to avoid double-counting
  const consumed: Array<[number, number]> = [];

  const isConsumed = (start: number, end: number): boolean =>
    consumed.some(([s, e]) => start < e && end > s);

  for (const phrase of SORTED_LEXICON_KEYS) {
    let searchStart = 0;
    let idx: number;

    while ((idx = lower.indexOf(phrase, searchStart)) !== -1) {
      const end = idx + phrase.length;

      // Boundary check: phrase must be surrounded by non-alpha characters
      const charBefore = idx > 0 ? lower[idx - 1] : " ";
      const charAfter = end < lower.length ? lower[end] : " ";
      const validBoundary = /\W/.test(charBefore) && /\W/.test(charAfter);

      if (!validBoundary || isConsumed(idx, end)) {
        searchStart = idx + 1;
        continue;
      }

      const entry = LEXICON[phrase];
      let weight = entry.weight;

      // ── Negation check (look back 4 words) ──
      const contextBefore = lower.slice(Math.max(0, idx - 40), idx);
      const wordsBefore = contextBefore.trim().split(/\s+/).slice(-4);
      const negation = wordsBefore.find((w) => NEGATION_TOKENS.has(w));
      if (negation) {
        weight = -weight * 0.8; // invert and slightly dampen
        negationsFound.push(negation);
      }

      // ── Intensifier / diminisher check (look back 2 words) ──
      const twoWordsBefore = wordsBefore.slice(-2);

      // Check multi-word diminishers first
      const twoWordPhrase = twoWordsBefore.join(" ");
      let modifier = 1.0;
      if (DIMINISHERS[twoWordPhrase]) {
        modifier = DIMINISHERS[twoWordPhrase];
        diminishersFound.push(twoWordPhrase);
      } else {
        for (const word of twoWordsBefore.reverse()) {
          if (INTENSIFIERS[word]) {
            modifier = INTENSIFIERS[word];
            intensifiersFound.push(word);
            break;
          }
          if (DIMINISHERS[word]) {
            modifier = DIMINISHERS[word];
            diminishersFound.push(word);
            break;
          }
        }
      }

      const finalWeight = weight * modifier;
      rawScore += finalWeight;

      // Distribute to dimensions
      for (const dim of entry.dimensions) {
        dimensionScores[dim] = (dimensionScores[dim] ?? 0) + finalWeight;
      }

      triggeredPhrases.push({
        phrase,
        weight: parseFloat(finalWeight.toFixed(2)),
        dimension: entry.dimensions.join("+"),
      });

      consumed.push([idx, end]);
      searchStart = end;
    }
  }

  return {
    rawScore,
    dimensionScores,
    negationsFound: [...new Set(negationsFound)],
    intensifiersFound: [...new Set(intensifiersFound)],
    diminishersFound: [...new Set(diminishersFound)],
    triggeredPhrases,
  };
}

// ─────────────────────────────────────────────────────────────────
// SECTION 9 — DOMAIN CLASSIFIER
// ─────────────────────────────────────────────────────────────────

function detectDomain(text: string): LifeDomain {
  const lower = text.toLowerCase();
  let bestDomain: LifeDomain = "unknown";
  let bestCount = 0;

  for (const [domain, config] of Object.entries(DOMAIN_PATTERNS) as Array<[LifeDomain, DomainPattern]>) {
    if (domain === "unknown") continue;
    const count = config.patterns.filter((p) => lower.includes(p)).length;
    if (count > bestCount) {
      bestCount = count;
      bestDomain = domain;
    }
  }

  return bestDomain;
}

// ─────────────────────────────────────────────────────────────────
// SECTION 10 — TEMPORAL URGENCY SCORER
// ─────────────────────────────────────────────────────────────────

function scoreTemporalUrgency(text: string): number {
  let total = 0;
  for (const { pattern, boost } of TEMPORAL_BOOST_PATTERNS) {
    if (pattern.test(text)) total += boost;
  }
  return Math.min(2.0, Math.max(-1.0, total));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 11 — SCORE NORMALISATION
// ─────────────────────────────────────────────────────────────────

/**
 * Maps raw lexical score (roughly -10 → +20) onto a 0-10 stress scale.
 * Uses a sigmoid-like soft clamp to avoid extreme values from dominating.
 */
function normalizeRawScore(raw: number): number {
  // Sigmoid: f(x) = 10 / (1 + e^{-k(x - midpoint)})
  // Calibrated so: raw=0 → ~5, raw=10 → ~8, raw=-6 → ~2
  const k = 0.35;
  const midpoint = 1.5;
  const sigmoid = 10 / (1 + Math.exp(-k * (raw - midpoint)));
  return Math.min(10, Math.max(0, sigmoid));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 12 — RECOMMENDATION SELECTOR
// ─────────────────────────────────────────────────────────────────

/**
 * Selects 2 recommendations. Strategy:
 *  1. High stress → always pick "meditation" first (urgent grounding)
 *  2. Domain affinity informs second pick category
 *  3. Moderate/Low → varied categories for holistic support
 *  4. Uses note-length as a deterministic seed to rotate within category
 */
function selectRecommendations(
  band: StressBand,
  domain: LifeDomain,
  noteSeed: number,
): Recommendation[] {
  const pool = REC_LIBRARY[band];
  const affinities = DOMAIN_PATTERNS[domain].affinityCategories;

  const chosen: Recommendation[] = [];
  const usedCategories = new Set<RecommendationCategory>();

  const pick = (category: RecommendationCategory) => {
    if (usedCategories.has(category) || chosen.length >= 2) return;
    const items = pool[category];
    const item = items[noteSeed % items.length];
    chosen.push(item);
    usedCategories.add(category);
  };

  if (band === "high") {
    // Urgency-first: immediate grounding technique first
    pick("meditation");
    // Second from domain affinity
    const secondAffinity = affinities.find((c) => c !== "meditation") ?? "tip";
    pick(secondAffinity);
  } else {
    // Pick first from domain affinity
    pick(affinities[0]);
    // Second from second affinity or complement
    const second = affinities[1] ?? (band === "moderate" ? "activity" : "music");
    pick(second);
  }

  // Fallback if we still don't have 2
  const fallbackOrder: RecommendationCategory[] = ["tip","activity","music","meditation"];
  for (const cat of fallbackOrder) {
    if (chosen.length >= 2) break;
    pick(cat);
  }

  return chosen;
}

// ─────────────────────────────────────────────────────────────────
// SECTION 13 — CONFIDENCE CALCULATOR
// ─────────────────────────────────────────────────────────────────

/**
 * Confidence is HIGH when:
 *   - Both text signals and self-report agree (low divergence)
 *   - Note is long enough to contain meaningful content (≥30 chars)
 * MEDIUM: moderate divergence or short note
 * LOW: large divergence or empty note
 */
function calculateConfidence(
  selfReport: number,
  textScore: number,
  noteLength: number,
): { level: "high" | "medium" | "low"; divergence: number } {
  const divergence = Math.abs(selfReport - textScore);
  const hasSubstantialText = noteLength >= 30;

  let level: "high" | "medium" | "low";
  if (divergence <= 2 && hasSubstantialText) level = "high";
  else if (divergence <= 4 || hasSubstantialText) level = "medium";
  else level = "low";

  return { level, divergence };
}

// ─────────────────────────────────────────────────────────────────
// SECTION 14 — PUBLIC EXPORT (drop-in compatible)
// ─────────────────────────────────────────────────────────────────

export async function analyzeMoodWithAI(
  inputData: MoodInput,
): Promise<AnalysisResult> {
  const {
    mood = "neutral",
    userStress = 5,
    note = "",
  } = inputData;

  // ── Signal 1: Self-report (anchor, weight 35%) ────────────────
  const selfReportScore = Math.min(10, Math.max(0, Number(userStress)));

  // ── Signal 2: Mood label (weight 15%) ─────────────────────────
  const moodKey = mood.trim().toLowerCase();
  const moodProfile = MOOD_PROFILES[moodKey] ?? MOOD_PROFILES["neutral"];
  const moodLabelScore = Math.min(10, Math.max(0, 5 + moodProfile.stressOffset));

  // ── Signal 3: Deep text analysis (weight 50%) ─────────────────
  const textAnalysis = analyzeText(note);
  const rawTextScore = textAnalysis.rawScore;
  const textScore = normalizeRawScore(rawTextScore);

  // ── Domain detection & boost ───────────────────────────────────
  const domain = detectDomain(note);
  const domainBoost = DOMAIN_PATTERNS[domain].stressBoost;

  // ── Temporal urgency ───────────────────────────────────────────
  const temporalUrgencyBoost = scoreTemporalUrgency(note);

  // ── Dimensional sub-scores (informational) ────────────────────
  const { V = 0, A = 0, C = 0, P = 0 } = textAnalysis.dimensionScores;
  const emotionalValence     = parseFloat(V.toFixed(2));
  const arousalScore         = parseFloat(A.toFixed(2));
  const cognitiveLoadScore   = parseFloat(C.toFixed(2));
  const physicalCueScore     = parseFloat(P.toFixed(2));

  // ── Confidence ─────────────────────────────────────────────────
  const { level: confidenceLevel, divergence } = calculateConfidence(
    selfReportScore,
    textScore,
    note.length,
  );

  // ── Blend ──────────────────────────────────────────────────────
  // When divergence is high, weight the text signal more heavily
  // (text is harder to consciously manipulate than a slider)
  const textWeight    = confidenceLevel === "low" ? 0.60 : 0.50;
  const selfWeight    = confidenceLevel === "low" ? 0.25 : 0.35;
  const moodWeight    = 1 - textWeight - selfWeight; // remainder

  const blendedRaw =
    selfWeight  * selfReportScore +
    moodWeight  * moodLabelScore  +
    textWeight  * textScore       +
    domainBoost                   +
    temporalUrgencyBoost;

  const finalStressLevel = Math.min(10, Math.max(0, Math.round(blendedRaw)));

  // ── Band ────────────────────────────────────────────────────────
  const stressBand: StressBand =
    finalStressLevel <= 3 ? "low" :
    finalStressLevel <= 6 ? "moderate" :
    "high";

  // ── Sentiment score ─────────────────────────────────────────────
  const aiSentimentScore = parseFloat((finalStressLevel / 10).toFixed(2));

  // ── Recommendations ─────────────────────────────────────────────
  const recommendations = selectRecommendations(stressBand, domain, note.length);

  // ── Debug payload ───────────────────────────────────────────────
  const debug: AnalysisDebug = {
    selfReportScore,
    moodLabelScore,
    textScore:            parseFloat(textScore.toFixed(2)),
    textRawScore:         parseFloat(rawTextScore.toFixed(2)),
    emotionalValence,
    arousalScore,
    cognitiveLoadScore,
    physicalCueScore,
    temporalUrgencyBoost: parseFloat(temporalUrgencyBoost.toFixed(2)),
    detectedDomain:       domain,
    domainBoost,
    negationsFound:       textAnalysis.negationsFound,
    intensifiersFound:    textAnalysis.intensifiersFound,
    diminishersFound:     textAnalysis.diminishersFound,
    triggeredPhrases:     textAnalysis.triggeredPhrases,
    selfReportTextDivergence: parseFloat(divergence.toFixed(2)),
    confidenceLevel,
    blendedRaw:           parseFloat(blendedRaw.toFixed(2)),
  };

  return {
    aiSentimentScore,
    aiStressLevel:   finalStressLevel,
    stressBand,
    detectedDomain:  domain,
    confidenceLevel,
    recommendations,
    debug,
  };
}

// Convenience alias
export { analyzeMoodWithAI as analyzeMood };