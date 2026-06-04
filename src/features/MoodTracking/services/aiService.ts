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
//  Analysis Engine  v3.0
//
//  Architecture:
//    1. Lexical NLP Layer
//       • Negation detection  ("not happy" → flips valence)
//       • Intensifiers        ("extremely anxious" → weight ×1.8)
//       • Diminishers         ("slightly tired" → weight ×0.5)
//       • Multi-word phrase priority over single-token matches
//       • Emoji sentiment layer (maps emojis to valence scores)
//       • Exclamation/punctuation intensity boost
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
//       • 48-entry library (3 bands × 4 categories × 4 items each)
//       • ALL 4 CATEGORIES (music, meditation, activity, tip)
//         are ALWAYS returned for every stress level
//       • Category affinity informs which item index is selected
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
  historyAverage?: number;  // optional rolling average for trend anchoring
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
  historyAnchorScore: number;
  emojiScore: number;
  punctuationBoost: number;
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
  aiSentimentScore: number;     // 0 (very positive) → 1 (very negative)
  aiStressLevel: number;        // 0 – 10 integer
  stressBand: StressBand;
  detectedDomain: LifeDomain;
  confidenceLevel: "high" | "medium" | "low";
  recommendations: Recommendation[];  // Always exactly 4 items (one per category)
  debug: AnalysisDebug;
}

// ─────────────────────────────────────────────────────────────────
// SECTION 2 — LEXICAL MODIFIERS
// ─────────────────────────────────────────────────────────────────

const NEGATION_TOKENS = new Set([
  "not", "no", "never", "neither", "nor", "nothing",
  "nobody", "nowhere", "don't", "doesn't", "didn't",
  "can't", "cannot", "couldn't", "won't", "wouldn't",
  "shouldn't", "wasn't", "weren't", "isn't", "aren't",
  "hardly", "scarcely", "barely", "without", "lack",
  "lacking", "free from", "free of",
]);

const INTENSIFIERS: Record<string, number> = {
  "extremely":      1.9,
  "incredibly":     1.8,
  "absolutely":     1.8,
  "completely":     1.7,
  "totally":        1.7,
  "utterly":        1.8,
  "so":             1.4,
  "very":           1.5,
  "really":         1.4,
  "quite":          1.3,
  "deeply":         1.6,
  "severely":       1.8,
  "terribly":       1.7,
  "awfully":        1.6,
  "horribly":       1.6,
  "insanely":       1.7,
  "unbearably":     1.9,
  "overwhelmingly": 2.0,
  "profoundly":     1.7,
  "desperately":    1.8,
  "massively":      1.6,
  "enormously":     1.6,
  "beyond":         1.5,
};

const DIMINISHERS: Record<string, number> = {
  "slightly":   0.4,
  "a bit":      0.5,
  "a little":   0.5,
  "somewhat":   0.6,
  "kind of":    0.6,
  "kinda":      0.6,
  "sort of":    0.6,
  "barely":     0.3,
  "mildly":     0.4,
  "fairly":     0.7,
  "rather":     0.7,
  "pretty":     0.8,
  "a tad":      0.4,
  "not that":   0.5,
  "not too":    0.5,
  "not very":   0.5,
};

// ─────────────────────────────────────────────────────────────────
// SECTION 3 — EMOJI SENTIMENT MAP
// ─────────────────────────────────────────────────────────────────

/**
 * Maps emoji to a raw stress delta.
 * Positive = stress-adding, Negative = stress-reducing.
 */
const EMOJI_STRESS_MAP: Record<string, number> = {
  // High stress
  "😰": 3.0, "😱": 3.5, "😭": 3.0, "😩": 3.0, "😫": 2.5,
  "🤯": 3.0, "😤": 2.5, "😠": 2.5, "🤬": 3.0, "💀": 2.5,
  "😔": 2.0, "😟": 2.0, "😣": 2.5, "😖": 2.5, "😢": 2.0,
  "💔": 3.0, "🥺": 1.5, "😓": 2.0, "😞": 2.0,
  // Moderate
  "😐": 0.5, "😑": 0.5, "🙄": 1.0, "😒": 1.0, "😕": 1.0,
  "🤔": 0.5, "😬": 1.5, "😮": 1.0,
  // Positive / stress-reducing
  "😊": -2.0, "😄": -2.0, "😁": -2.0, "🥰": -2.5, "😍": -2.0,
  "🤩": -2.0, "😌": -2.5, "😎": -1.5, "🙂": -1.0, "😀": -2.0,
  "🎉": -1.5, "❤️": -1.5, "💪": -1.5, "✨": -1.0, "🌟": -1.0,
  "😴": -1.0, "🧘": -2.5, "☺️": -1.5, "🤗": -1.5,
};

// ─────────────────────────────────────────────────────────────────
// SECTION 4 — MULTI-DIMENSIONAL KEYWORD LEXICON (EXPANDED)
// ─────────────────────────────────────────────────────────────────

interface LexiconEntry {
  weight: number;
  dimensions: string[];
}

const LEXICON: Record<string, LexiconEntry> = {

  // ── CRITICAL / HIGH-STRESS PHRASES ────────────────────────────
  "anxiety attack":           { weight: 4.5, dimensions: ["V","A","P"] },
  "panic attack":             { weight: 4.5, dimensions: ["V","A","P"] },
  "suicidal thoughts":        { weight: 5.0, dimensions: ["V","C"] },
  "want to die":              { weight: 5.0, dimensions: ["V"] },
  "end it all":               { weight: 5.0, dimensions: ["V"] },
  "falling apart":            { weight: 3.5, dimensions: ["V","C"] },
  "can't cope":               { weight: 3.5, dimensions: ["V","C"] },
  "cannot cope":              { weight: 3.5, dimensions: ["V","C"] },
  "out of control":           { weight: 3.5, dimensions: ["V","A","C"] },
  "losing my mind":           { weight: 3.5, dimensions: ["V","C"] },
  "losing it":                { weight: 3.0, dimensions: ["V","A"] },
  "breaking down":            { weight: 3.5, dimensions: ["V","A"] },
  "breakdown":                { weight: 3.5, dimensions: ["V","A"] },
  "heart racing":             { weight: 3.0, dimensions: ["A","P"] },
  "heart pounding":           { weight: 3.0, dimensions: ["A","P"] },
  "can't breathe":            { weight: 3.0, dimensions: ["A","P"] },
  "cannot breathe":           { weight: 3.0, dimensions: ["A","P"] },
  "chest tight":              { weight: 3.0, dimensions: ["A","P"] },
  "chest tightness":          { weight: 3.0, dimensions: ["A","P"] },
  "chest pain":               { weight: 3.5, dimensions: ["A","P"] },
  "can't sleep":              { weight: 2.5, dimensions: ["A","P"] },
  "cannot sleep":             { weight: 2.5, dimensions: ["A","P"] },
  "can't eat":                { weight: 2.5, dimensions: ["V","P"] },
  "can't focus":              { weight: 2.5, dimensions: ["C"] },
  "can't think":              { weight: 2.5, dimensions: ["C"] },
  "mind is blank":            { weight: 2.0, dimensions: ["C"] },
  "mind racing":              { weight: 2.5, dimensions: ["A","C"] },
  "thoughts racing":          { weight: 2.5, dimensions: ["A","C"] },
  "feel worthless":           { weight: 4.0, dimensions: ["V"] },
  "feeling worthless":        { weight: 4.0, dimensions: ["V"] },
  "feel useless":             { weight: 3.5, dimensions: ["V"] },
  "want to give up":          { weight: 4.0, dimensions: ["V","C"] },
  "want to quit":             { weight: 3.0, dimensions: ["V"] },
  "everything is falling":    { weight: 3.5, dimensions: ["V","C"] },
  "everything hurts":         { weight: 3.0, dimensions: ["V","P"] },
  "no hope":                  { weight: 4.0, dimensions: ["V"] },
  "no point":                 { weight: 3.5, dimensions: ["V"] },
  "burned out":               { weight: 3.0, dimensions: ["V","P","C"] },
  "burnt out":                { weight: 3.0, dimensions: ["V","P","C"] },
  "falling behind":           { weight: 2.5, dimensions: ["C","V"] },
  "behind on":                { weight: 2.0, dimensions: ["C"] },
  "completely lost":          { weight: 3.0, dimensions: ["V","C"] },
  "complete disaster":        { weight: 3.5, dimensions: ["V"] },
  "total failure":            { weight: 3.5, dimensions: ["V"] },
  "hitting rock bottom":      { weight: 4.0, dimensions: ["V","C"] },
  "rock bottom":              { weight: 4.0, dimensions: ["V","C"] },
  "at my limit":              { weight: 3.5, dimensions: ["V","C"] },
  "end of my rope":           { weight: 3.5, dimensions: ["V","C"] },
  "can't handle":             { weight: 3.0, dimensions: ["V","C"] },
  "cannot handle":            { weight: 3.0, dimensions: ["V","C"] },
  "too much to handle":       { weight: 3.5, dimensions: ["V","C"] },
  "feel trapped":             { weight: 3.0, dimensions: ["V","C"] },
  "feel stuck":               { weight: 2.5, dimensions: ["V","C"] },
  "can't escape":             { weight: 3.0, dimensions: ["V","A"] },
  "i hate myself":            { weight: 4.5, dimensions: ["V"] },
  "hate myself":              { weight: 4.5, dimensions: ["V"] },
  "so alone":                 { weight: 3.0, dimensions: ["V"] },
  "completely alone":         { weight: 3.0, dimensions: ["V"] },
  "nobody cares":             { weight: 3.5, dimensions: ["V"] },
  "no one cares":             { weight: 3.5, dimensions: ["V"] },
  "not good enough":          { weight: 3.0, dimensions: ["V","C"] },
  "never good enough":        { weight: 3.5, dimensions: ["V","C"] },
  "imposter syndrome":        { weight: 2.5, dimensions: ["V","C"] },

  // ── HIGH SINGLE TOKENS ────────────────────────────────────────
  "overwhelmed":              { weight: 3.5, dimensions: ["V","A","C"] },
  "panic":                    { weight: 3.0, dimensions: ["V","A"] },
  "panicking":                { weight: 3.0, dimensions: ["V","A"] },
  "hopeless":                 { weight: 3.5, dimensions: ["V"] },
  "desperate":                { weight: 3.0, dimensions: ["V","A"] },
  "crisis":                   { weight: 3.0, dimensions: ["V","A"] },
  "terrified":                { weight: 3.0, dimensions: ["V","A"] },
  "petrified":                { weight: 3.0, dimensions: ["V","A"] },
  "unbearable":               { weight: 3.0, dimensions: ["V"] },
  "shaking":                  { weight: 2.5, dimensions: ["A","P"] },
  "trembling":                { weight: 2.5, dimensions: ["A","P"] },
  "dread":                    { weight: 2.5, dimensions: ["V","A"] },
  "nightmare":                { weight: 2.5, dimensions: ["V"] },
  "disaster":                 { weight: 2.5, dimensions: ["V"] },
  "failed":                   { weight: 2.5, dimensions: ["V"] },
  "failure":                  { weight: 2.5, dimensions: ["V"] },
  "exhausted":                { weight: 2.5, dimensions: ["V","P"] },
  "drained":                  { weight: 2.0, dimensions: ["V","P"] },
  "depleted":                 { weight: 2.0, dimensions: ["V","P"] },
  "depressed":                { weight: 3.0, dimensions: ["V"] },
  "depression":               { weight: 3.0, dimensions: ["V"] },
  "miserable":                { weight: 2.5, dimensions: ["V"] },
  "horrible":                 { weight: 2.5, dimensions: ["V"] },
  "terrible":                 { weight: 2.5, dimensions: ["V"] },
  "awful":                    { weight: 2.5, dimensions: ["V"] },
  "furious":                  { weight: 2.5, dimensions: ["V","A"] },
  "rage":                     { weight: 2.5, dimensions: ["V","A"] },
  "suffocating":              { weight: 3.0, dimensions: ["A","P"] },
  "isolated":                 { weight: 2.0, dimensions: ["V"] },
  "paralyzed":                { weight: 2.5, dimensions: ["V","C"] },
  "nauseous":                 { weight: 2.0, dimensions: ["P"] },
  "headache":                 { weight: 1.5, dimensions: ["P"] },
  "headaches":                { weight: 1.5, dimensions: ["P"] },
  "spiraling":                { weight: 3.0, dimensions: ["V","A","C"] },
  "spiralling":               { weight: 3.0, dimensions: ["V","A","C"] },
  "triggered":                { weight: 2.0, dimensions: ["V","A"] },
  "imploding":                { weight: 3.0, dimensions: ["V","A"] },
  "suffocate":                { weight: 2.5, dimensions: ["A","P"] },

  // ── MODERATE STRESS ───────────────────────────────────────────
  "anxious":                  { weight: 2.0, dimensions: ["V","A"] },
  "anxiety":                  { weight: 2.0, dimensions: ["V","A"] },
  "stressed":                 { weight: 2.0, dimensions: ["V","A"] },
  "stress":                   { weight: 1.5, dimensions: ["V","A"] },
  "worried":                  { weight: 1.5, dimensions: ["V","C"] },
  "worry":                    { weight: 1.5, dimensions: ["V","C"] },
  "nervous":                  { weight: 1.5, dimensions: ["V","A"] },
  "tense":                    { weight: 1.5, dimensions: ["A","P"] },
  "upset":                    { weight: 1.5, dimensions: ["V"] },
  "sad":                      { weight: 1.5, dimensions: ["V"] },
  "unhappy":                  { weight: 1.5, dimensions: ["V"] },
  "annoyed":                  { weight: 1.5, dimensions: ["V","A"] },
  "irritated":                { weight: 1.5, dimensions: ["V","A"] },
  "frustrated":               { weight: 2.0, dimensions: ["V","A"] },
  "angry":                    { weight: 2.0, dimensions: ["V","A"] },
  "hate":                     { weight: 2.0, dimensions: ["V"] },
  "confused":                 { weight: 1.0, dimensions: ["C"] },
  "unsure":                   { weight: 1.0, dimensions: ["C"] },
  "doubt":                    { weight: 1.0, dimensions: ["C"] },
  "doubting":                 { weight: 1.0, dimensions: ["C"] },
  "tired":                    { weight: 1.0, dimensions: ["V","P"] },
  "fatigue":                  { weight: 1.5, dimensions: ["P"] },
  "fatigued":                 { weight: 1.5, dimensions: ["P"] },
  "bored":                    { weight: 0.5, dimensions: ["V"] },
  "lonely":                   { weight: 1.5, dimensions: ["V"] },
  "stuck":                    { weight: 2.0, dimensions: ["V","C"] },
  "lost":                     { weight: 1.5, dimensions: ["V","C"] },
  "behind":                   { weight: 1.0, dimensions: ["C"] },
  "deadline":                 { weight: 1.5, dimensions: ["A","C"] },
  "deadlines":                { weight: 1.5, dimensions: ["A","C"] },
  "pressure":                 { weight: 2.0, dimensions: ["A","C"] },
  "overwhelm":                { weight: 2.5, dimensions: ["V","A","C"] },
  "regret":                   { weight: 1.5, dimensions: ["V"] },
  "guilt":                    { weight: 2.0, dimensions: ["V"] },
  "shame":                    { weight: 2.0, dimensions: ["V"] },
  "embarrassed":              { weight: 1.5, dimensions: ["V"] },
  "humiliated":               { weight: 2.5, dimensions: ["V"] },
  "rejected":                 { weight: 2.0, dimensions: ["V"] },
  "betrayed":                 { weight: 2.5, dimensions: ["V"] },
  "hurt":                     { weight: 1.5, dimensions: ["V"] },
  "heartbroken":              { weight: 3.0, dimensions: ["V"] },
  "grief":                    { weight: 3.0, dimensions: ["V"] },
  "grieving":                 { weight: 3.0, dimensions: ["V"] },
  "loss":                     { weight: 2.0, dimensions: ["V"] },
  "overthinking":             { weight: 2.0, dimensions: ["C","A"] },
  "overanalyzing":            { weight: 2.0, dimensions: ["C"] },
  "procrastinating":          { weight: 1.5, dimensions: ["C"] },
  "procrastination":          { weight: 1.5, dimensions: ["C"] },
  "unmotivated":              { weight: 1.5, dimensions: ["V","C"] },
  "demotivated":              { weight: 1.5, dimensions: ["V","C"] },
  "apathetic":                { weight: 1.5, dimensions: ["V"] },
  "apathy":                   { weight: 1.5, dimensions: ["V"] },
  "discouraged":              { weight: 2.0, dimensions: ["V","C"] },
  "disheartened":             { weight: 2.0, dimensions: ["V"] },
  "disappointed":             { weight: 1.5, dimensions: ["V"] },
  "resentful":                { weight: 2.0, dimensions: ["V"] },
  "resentment":               { weight: 2.0, dimensions: ["V"] },
  "envious":                  { weight: 1.5, dimensions: ["V"] },
  "jealous":                  { weight: 1.5, dimensions: ["V"] },
  "insecure":                 { weight: 2.0, dimensions: ["V","C"] },
  "inadequate":               { weight: 2.0, dimensions: ["V","C"] },

  // ── LOW STRESS / POSITIVE VALENCE ─────────────────────────────
  "happy":                    { weight: -2.0, dimensions: ["V"] },
  "joyful":                   { weight: -2.0, dimensions: ["V","A"] },
  "joy":                      { weight: -1.5, dimensions: ["V"] },
  "excited":                  { weight: -1.5, dimensions: ["V","A"] },
  "grateful":                 { weight: -2.0, dimensions: ["V"] },
  "gratitude":                { weight: -2.0, dimensions: ["V"] },
  "thankful":                 { weight: -2.0, dimensions: ["V"] },
  "peaceful":                 { weight: -2.5, dimensions: ["V","A"] },
  "peace":                    { weight: -2.0, dimensions: ["V","A"] },
  "calm":                     { weight: -2.5, dimensions: ["V","A"] },
  "relaxed":                  { weight: -2.0, dimensions: ["V","A","P"] },
  "content":                  { weight: -1.5, dimensions: ["V"] },
  "okay":                     { weight: -0.5, dimensions: ["V"] },
  "fine":                     { weight: -0.5, dimensions: ["V"] },
  "good":                     { weight: -1.0, dimensions: ["V"] },
  "great":                    { weight: -1.5, dimensions: ["V"] },
  "amazing":                  { weight: -2.0, dimensions: ["V"] },
  "wonderful":                { weight: -2.0, dimensions: ["V"] },
  "fantastic":                { weight: -2.0, dimensions: ["V"] },
  "energized":                { weight: -1.5, dimensions: ["V","A","P"] },
  "motivated":                { weight: -1.5, dimensions: ["V","C"] },
  "focused":                  { weight: -1.5, dimensions: ["C"] },
  "productive":               { weight: -1.0, dimensions: ["C"] },
  "rested":                   { weight: -1.5, dimensions: ["P"] },
  "refreshed":                { weight: -1.5, dimensions: ["V","P"] },
  "optimistic":               { weight: -1.5, dimensions: ["V","C"] },
  "hopeful":                  { weight: -1.5, dimensions: ["V"] },
  "confident":                { weight: -1.5, dimensions: ["V","C"] },
  "loved":                    { weight: -1.5, dimensions: ["V"] },
  "supported":                { weight: -1.5, dimensions: ["V"] },
  "accomplished":             { weight: -1.5, dimensions: ["V","C"] },
  "proud":                    { weight: -1.5, dimensions: ["V"] },
  "relieved":                 { weight: -2.0, dimensions: ["V","A"] },
  "at ease":                  { weight: -2.0, dimensions: ["V","A"] },
  "light":                    { weight: -1.0, dimensions: ["V"] },
  "blissful":                 { weight: -2.5, dimensions: ["V"] },
  "serene":                   { weight: -2.5, dimensions: ["V","A"] },
  "inspired":                 { weight: -1.5, dimensions: ["V","C"] },
  "enthusiastic":             { weight: -1.5, dimensions: ["V","A"] },
  "alive":                    { weight: -1.5, dimensions: ["V","P"] },
  "thriving":                 { weight: -2.0, dimensions: ["V","P","C"] },
  "flourishing":              { weight: -2.0, dimensions: ["V"] },
  "balanced":                 { weight: -2.0, dimensions: ["V","A","C"] },
  "steady":                   { weight: -1.5, dimensions: ["V","A"] },
  "grounded":                 { weight: -2.0, dimensions: ["V","A"] },
  "centered":                 { weight: -2.0, dimensions: ["V","A","C"] },
  "in control":               { weight: -1.5, dimensions: ["V","C"] },
};

// ─────────────────────────────────────────────────────────────────
// SECTION 5 — MOOD LABEL MAP
// ─────────────────────────────────────────────────────────────────

interface MoodProfile {
  stressOffset: number;
  valence: number;
  arousal: number;
}

const MOOD_PROFILES: Record<string, MoodProfile> = {
  // High stress
  "angry":          { stressOffset: 3,  valence: -0.9, arousal:  0.9 },
  "panicked":       { stressOffset: 4,  valence: -1.0, arousal:  1.0 },
  "panicking":      { stressOffset: 4,  valence: -1.0, arousal:  1.0 },
  "anxious":        { stressOffset: 3,  valence: -0.8, arousal:  0.8 },
  "depressed":      { stressOffset: 3,  valence: -1.0, arousal: -0.5 },
  "stressed":       { stressOffset: 3,  valence: -0.7, arousal:  0.7 },
  "overwhelmed":    { stressOffset: 4,  valence: -0.9, arousal:  0.9 },
  "hopeless":       { stressOffset: 3,  valence: -1.0, arousal: -0.2 },
  "heartbroken":    { stressOffset: 3,  valence: -1.0, arousal: -0.3 },
  "furious":        { stressOffset: 3,  valence: -0.9, arousal:  1.0 },
  "terrified":      { stressOffset: 4,  valence: -1.0, arousal:  1.0 },
  "desperate":      { stressOffset: 3,  valence: -0.9, arousal:  0.8 },
  "burnout":        { stressOffset: 3,  valence: -0.8, arousal: -0.3 },
  "burned out":     { stressOffset: 3,  valence: -0.8, arousal: -0.3 },
  // Moderate
  "frustrated":     { stressOffset: 2,  valence: -0.6, arousal:  0.5 },
  "sad":            { stressOffset: 2,  valence: -0.7, arousal: -0.3 },
  "worried":        { stressOffset: 2,  valence: -0.6, arousal:  0.6 },
  "tired":          { stressOffset: 1,  valence: -0.4, arousal: -0.6 },
  "confused":       { stressOffset: 1,  valence: -0.3, arousal:  0.2 },
  "lonely":         { stressOffset: 2,  valence: -0.6, arousal: -0.3 },
  "guilty":         { stressOffset: 2,  valence: -0.7, arousal:  0.3 },
  "bored":          { stressOffset: 0,  valence: -0.2, arousal: -0.5 },
  "irritated":      { stressOffset: 2,  valence: -0.5, arousal:  0.5 },
  "disappointed":   { stressOffset: 2,  valence: -0.6, arousal: -0.1 },
  "insecure":       { stressOffset: 2,  valence: -0.5, arousal:  0.3 },
  "unmotivated":    { stressOffset: 1,  valence: -0.4, arousal: -0.4 },
  "melancholy":     { stressOffset: 2,  valence: -0.6, arousal: -0.4 },
  // Neutral
  "neutral":        { stressOffset: 0,  valence:  0.0, arousal:  0.0 },
  "okay":           { stressOffset: -1, valence:  0.1, arousal:  0.0 },
  "fine":           { stressOffset: -1, valence:  0.1, arousal:  0.0 },
  "mixed":          { stressOffset: 0,  valence:  0.0, arousal:  0.2 },
  "meh":            { stressOffset: 0,  valence: -0.1, arousal: -0.2 },
  "alright":        { stressOffset: -1, valence:  0.1, arousal:  0.0 },
  // Positive
  "happy":          { stressOffset: -3, valence:  0.8, arousal:  0.4 },
  "excited":        { stressOffset: -2, valence:  0.8, arousal:  0.9 },
  "calm":           { stressOffset: -3, valence:  0.7, arousal: -0.8 },
  "grateful":       { stressOffset: -3, valence:  0.9, arousal:  0.1 },
  "content":        { stressOffset: -2, valence:  0.6, arousal: -0.2 },
  "peaceful":       { stressOffset: -3, valence:  0.8, arousal: -0.9 },
  "energized":      { stressOffset: -2, valence:  0.7, arousal:  0.8 },
  "motivated":      { stressOffset: -2, valence:  0.7, arousal:  0.7 },
  "hopeful":        { stressOffset: -2, valence:  0.7, arousal:  0.3 },
  "relieved":       { stressOffset: -2, valence:  0.8, arousal: -0.1 },
  "proud":          { stressOffset: -2, valence:  0.8, arousal:  0.3 },
  "joyful":         { stressOffset: -3, valence:  0.9, arousal:  0.6 },
  "blissful":       { stressOffset: -3, valence:  1.0, arousal:  0.2 },
  "inspired":       { stressOffset: -2, valence:  0.8, arousal:  0.5 },
  "confident":      { stressOffset: -2, valence:  0.7, arousal:  0.4 },
  "refreshed":      { stressOffset: -2, valence:  0.7, arousal:  0.1 },
  "grounded":       { stressOffset: -2, valence:  0.7, arousal: -0.5 },
};

// ─────────────────────────────────────────────────────────────────
// SECTION 6 — LIFE DOMAIN PATTERNS
// ─────────────────────────────────────────────────────────────────

interface DomainPattern {
  patterns: string[];
  stressBoost: number;
  affinityIndices: Record<RecommendationCategory, number>;  // which item to pick
}

const DOMAIN_PATTERNS: Record<LifeDomain, DomainPattern> = {
  work: {
    patterns: [
      "work","job","boss","manager","colleague","coworker","office",
      "meeting","project","deadline","promotion","fired","layoff",
      "performance review","overworked","workload","career","salary",
      "resign","resignation","client","presentation","overtime","corporate",
      "interview","recruiter","contract","unemployed","unemployment",
    ],
    stressBoost: 0.5,
    affinityIndices: { tip: 1, activity: 0, meditation: 1, music: 2 },
  },
  academic: {
    patterns: [
      "exam","test","study","homework","assignment","grade","school",
      "university","college","professor","lecture","thesis","dissertation",
      "midterm","finals","gpa","fail","pass","tuition","class","scholarship",
      "research","paper","essay","plagiarism","attendance",
    ],
    stressBoost: 0.5,
    affinityIndices: { tip: 0, activity: 1, meditation: 0, music: 0 },
  },
  relationships: {
    patterns: [
      "relationship","partner","boyfriend","girlfriend","husband","wife",
      "breakup","divorce","argument","fight","cheating","trust","love",
      "family","parent","mom","dad","sibling","friend","friendship",
      "communication","boundaries","toxic","abuse","manipulation",
    ],
    stressBoost: 0.7,
    affinityIndices: { tip: 2, activity: 2, meditation: 1, music: 1 },
  },
  health: {
    patterns: [
      "doctor","hospital","diagnosis","sick","illness","pain","surgery",
      "treatment","medication","therapy","chronic","symptom","injury",
      "mental health","physical health","sleep","insomnia","diet","weight",
      "exercise","recover","recovery","rehab","disability","condition",
    ],
    stressBoost: 0.8,
    affinityIndices: { tip: 1, activity: 0, meditation: 2, music: 0 },
  },
  financial: {
    patterns: [
      "money","debt","bills","rent","mortgage","savings","loan","credit",
      "broke","bankrupt","afford","expensive","budget","income","invest",
      "financial","poverty","wealth","tax","payment","spending","salary",
    ],
    stressBoost: 0.6,
    affinityIndices: { tip: 0, activity: 1, meditation: 0, music: 2 },
  },
  grief: {
    patterns: [
      "death","died","loss","grief","grieving","funeral","mourning",
      "passed away","gone","miss","memorial","bereave","widow","orphan",
      "mourn","farewell","eulogy","cemetery","ashes","departed",
    ],
    stressBoost: 1.2,
    affinityIndices: { tip: 2, activity: 2, meditation: 2, music: 1 },
  },
  identity: {
    patterns: [
      "who am i","purpose","meaning","direction","identity","belonging",
      "worth","value","self-esteem","confidence","insecure","imposter",
      "existential","future","life plan","goals","self worth","self image",
      "authenticity","genuine","real me","lost myself",
    ],
    stressBoost: 0.5,
    affinityIndices: { tip: 1, activity: 0, meditation: 2, music: 0 },
  },
  social: {
    patterns: [
      "social","party","crowd","people","event","gathering","awkward",
      "social anxiety","judged","embarrass","presentation","public speaking",
      "networking","rejection","fitting in","belong","friends","acquaintance",
      "introvert","extrovert","conversation","interact",
    ],
    stressBoost: 0.4,
    affinityIndices: { tip: 0, activity: 0, meditation: 1, music: 2 },
  },
  unknown: {
    patterns: [],
    stressBoost: 0,
    affinityIndices: { tip: 0, activity: 0, meditation: 0, music: 0 },
  },
};

// ─────────────────────────────────────────────────────────────────
// SECTION 7 — TEMPORAL URGENCY PATTERNS
// ─────────────────────────────────────────────────────────────────

const TEMPORAL_BOOST_PATTERNS: { pattern: RegExp; boost: number }[] = [
  { pattern: /right now|this moment|currently|at the moment/i,  boost: 1.0 },
  { pattern: /today|tonight|this morning|this afternoon/i,      boost: 0.8 },
  { pattern: /this week|these days|lately|recently/i,           boost: 0.5 },
  { pattern: /always|every day|constantly|all the time/i,       boost: 0.7 },
  { pattern: /never going to|won't ever|can't ever/i,           boost: 0.6 },
  { pattern: /for weeks|for months|for years/i,                 boost: 0.8 },
  { pattern: /keeps happening|keeps coming back|recurring/i,    boost: 0.6 },
  { pattern: /used to|last year|back then|in the past/i,        boost: -0.3 },
  { pattern: /someday|eventually|might|maybe/i,                 boost: -0.2 },
  { pattern: /getting better|improving|feels better/i,          boost: -0.4 },
];

// ─────────────────────────────────────────────────────────────────
// SECTION 8 — RECOMMENDATION LIBRARY (48 items)
//   3 bands × 4 categories × 4 items each
//   ALL 4 CATEGORIES ARE ALWAYS RETURNED
// ─────────────────────────────────────────────────────────────────

type RecLibrary = Record<StressBand, Record<RecommendationCategory, Recommendation[]>>;

const REC_LIBRARY: RecLibrary = {

  // ────────────────────────── LOW STRESS (0–3) ──────────────────

  low: {
    meditation: [
      {
        category: "meditation",
        title: "5-Min Gratitude Body Scan",
        description:
          "Close your eyes. Breathe in slowly and mentally thank one body part per breath — feet for carrying you, hands for creating. 5 minutes rewires your baseline toward abundance.",
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
      {
        category: "meditation",
        title: "Loving-Kindness (Metta) Practice",
        description:
          "Silently repeat 'May I be happy, may I be well, may I be at peace' — then extend it to loved ones and all beings. 10 minutes of metta raises subjective wellbeing measurably.",
        link: "https://www.youtube.com/watch?v=sz7cpV7ERsM",
        stressRange: "0-3",
      },
      {
        category: "meditation",
        title: "Morning Mindful Breathing — 7 Minutes",
        description:
          "A gentle anchor to start the day: observe each inhale and exhale for 7 minutes without trying to change the breath. Sets a calm tone for the next several hours.",
        link: "https://www.youtube.com/watch?v=nmFUDkj1Aq0",
        stressRange: "0-3",
      },
    ],
    music: [
      {
        category: "music",
        title: "Lo-Fi Chill Study Beats",
        description:
          "60–70 BPM lo-fi tracks synchronize with your natural resting heart rate, sustaining focus without overstimulation.",
        link: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        stressRange: "0-3",
      },
      {
        category: "music",
        title: "Nature Soundscape — Forest Rain",
        description:
          "Pink noise from rain recordings has been shown to improve cognitive performance and preserve a calm state throughout the day.",
        link: "https://www.youtube.com/watch?v=yIQd2Ya0Ziw",
        stressRange: "0-3",
      },
      {
        category: "music",
        title: "Acoustic Morning Playlist — Uplifting Folk",
        description:
          "Warm acoustic guitar and gentle vocals that amplify a positive mood without creating artificial hype. Perfect for journaling or light creative work.",
        link: "https://www.youtube.com/watch?v=36YnV9STBqc",
        stressRange: "0-3",
      },
      {
        category: "music",
        title: "528 Hz Solfeggio Frequency — Transformation",
        description:
          "Tuned to 528 Hz (the 'love frequency'), this ambient track encourages a light, open state of mind — ideal to play softly in the background during positive activities.",
        link: "https://www.youtube.com/watch?v=9Oz_7VJKFZU",
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
          "5 rounds of Sun Salutation A maintain body-mind coherence and energy balance when stress is low. A perfect 8-minute morning anchor.",
        link: "https://www.youtube.com/watch?v=C0tVN-DvZvI",
        stressRange: "0-3",
      },
      {
        category: "activity",
        title: "Qi Gong Flow — 10 Minutes",
        description:
          "Gentle flowing movements from traditional Qi Gong coordinate breath, body and intention, preserving the calm state you're already in while adding gentle energy.",
        link: "https://www.youtube.com/watch?v=cwlvTcWR3Gs",
        stressRange: "0-3",
      },
      {
        category: "activity",
        title: "Creative Journaling Prompt Session",
        description:
          "Open a notebook and write freely for 10 minutes: 'What would I attempt if I knew I could not fail?' Low-stress states are the optimal window for visioning and goal-setting.",
        link: "https://www.youtube.com/watch?v=3NKOLHQSNeo",
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
      {
        category: "tip",
        title: "The 'Three Good Things' Practice",
        description:
          "Before bed, write 3 specific good things that happened today and why they happened. Research by Martin Seligman shows this practice measurably raises happiness in 1 week.",
        link: "https://www.youtube.com/watch?v=YFKyNkFqd5g",
        stressRange: "0-3",
      },
      {
        category: "tip",
        title: "Proactive Stress Inoculation",
        description:
          "Use this calm period to mentally rehearse how you'd handle your most common stressors — step by step. Pre-planning responses reduces future stress reactivity by 40%.",
        link: "https://www.youtube.com/watch?v=RcGyVTAoXEU",
        stressRange: "0-3",
      },
    ],
  },

  // ─────────────────────── MODERATE STRESS (4–6) ───────────────

  moderate: {
    meditation: [
      {
        category: "meditation",
        title: "4-7-8 Breathing — Parasympathetic Reset",
        description:
          "Inhale 4s, hold 7s, exhale 8s. The extended exhale activates the vagus nerve and drops cortisol within 4 cycles. Do this seated anywhere.",
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
      {
        category: "meditation",
        title: "Nadi Shodhana — Alternate Nostril Breathing",
        description:
          "Close the right nostril, inhale left 4s, hold 4s, exhale right 4s, hold 4s, repeat on other side. Balances the nervous system hemispheres and calms mental chatter within minutes.",
        link: "https://www.youtube.com/watch?v=8V9DmxLfGAk",
        stressRange: "4-6",
      },
      {
        category: "meditation",
        title: "Guided Visualization — Safe Place Meditation",
        description:
          "A therapist-led guided imagery session where you mentally build and inhabit a safe, peaceful place. Engages the imagination to physically lower stress hormones.",
        link: "https://www.youtube.com/watch?v=86m4RC_ADEY",
        stressRange: "4-6",
      },
    ],
    music: [
      {
        category: "music",
        title: "Calming Classical Piano — Cortisol Reducer",
        description:
          "Slow-tempo classical pieces (60–80 BPM) shown in research to lower cortisol and blood pressure within 10 minutes of listening.",
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
      {
        category: "music",
        title: "Rain & Gentle Piano — Stress Relief Mix",
        description:
          "The combination of soft piano melody with layered rain sounds engages both the auditory cortex and the default mode network, gently pulling the mind away from rumination.",
        link: "https://www.youtube.com/watch?v=1ZYbU82GVz4",
        stressRange: "4-6",
      },
      {
        category: "music",
        title: "Yoga Flow Playlist — Instrumental",
        description:
          "Mellow, rhythmic instrumentals designed to support movement or stillness at moderate stress — tempo gradually slows over the session, pulling physiology along with it.",
        link: "https://www.youtube.com/watch?v=5qap5aO4i9A",
        stressRange: "4-6",
      },
    ],
    activity: [
      {
        category: "activity",
        title: "Progressive Muscle Relaxation (PMR)",
        description:
          "Tense each muscle group 5s, release 20s — feet → calves → thighs → abdomen → hands → shoulders → face. Dissolves the physical component of moderate stress effectively.",
        link: "https://www.youtube.com/watch?v=1nZEdqcGVzo",
        stressRange: "4-6",
      },
      {
        category: "activity",
        title: "5-Minute EFT Tapping — Anxiety Relief",
        description:
          "Emotional Freedom Technique: tap 9 acupressure points while stating your stressor aloud. Studies show cortisol drops 24% in one session.",
        link: "https://www.youtube.com/watch?v=mKWMl0RJzYA",
        stressRange: "4-6",
      },
      {
        category: "activity",
        title: "20-Minute Stress-Relief Walk + Podcast",
        description:
          "A brisk 20-minute walk triggers endorphin release while a calming or uplifting podcast shifts mental context. Movement + narrative is a powerful dual-channel stress reset.",
        link: "https://www.youtube.com/watch?v=UME9tDPYOH8",
        stressRange: "4-6",
      },
      {
        category: "activity",
        title: "Restorative Yoga — 15 Minutes",
        description:
          "Long-held supported poses (3–5 minutes each) signal the nervous system that it is safe to rest. Particularly effective for cognitive overload and emotional exhaustion.",
        link: "https://www.youtube.com/watch?v=BiWDsfZ3zbo",
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
          "Say out loud: 'I'm having the thought that...' before your stressor. This prefix creates psychological distance from the thought, reducing its emotional grip immediately.",
        link: "https://www.youtube.com/watch?v=WbmuvHhFfUk",
        stressRange: "4-6",
      },
      {
        category: "tip",
        title: "Worry Time Scheduling",
        description:
          "Designate a strict 15-minute 'worry window' once per day. When stress thoughts arise outside it, write them down and defer them. This breaks the always-on rumination loop.",
        link: "https://www.youtube.com/watch?v=i2j3dJnJIFQ",
        stressRange: "4-6",
      },
      {
        category: "tip",
        title: "The STOP Mindfulness Technique",
        description:
          "Stop what you're doing → Take one deep breath → Observe thoughts/feelings without judgment → Proceed with awareness. 60 seconds that prevents stress from compounding.",
        link: "https://www.youtube.com/watch?v=pqRJAhGqSfk",
        stressRange: "4-6",
      },
    ],
  },

  // ──────────────────────── HIGH STRESS (7–10) ──────────────────

  high: {
    meditation: [
      {
        category: "meditation",
        title: "Box Breathing — Immediate Nervous System Override",
        description:
          "Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 5 cycles. Used by Navy SEALs to override acute panic response within 90 seconds. Do it now.",
        link: "https://www.youtube.com/watch?v=n6RbW2BXOdf",
        stressRange: "7-10",
      },
      {
        category: "meditation",
        title: "Physiological Sigh — Fastest Stress Deflation",
        description:
          "Double inhale through nose (fill lungs, then sniff more air in), then one long slow exhale through the mouth. A single cycle deflates physiological stress faster than any other known breathing pattern.",
        link: "https://www.youtube.com/watch?v=rBdhqBGqiMc",
        stressRange: "7-10",
      },
      {
        category: "meditation",
        title: "SOS Grounding Meditation — 5 Minutes",
        description:
          "A crisis-optimized guided meditation: places both feet on the floor, guides attention through physical anchors, and uses spoken affirmations to halt the stress spiral. Use headphones.",
        link: "https://www.youtube.com/watch?v=cEqZthCaMpo",
        stressRange: "7-10",
      },
      {
        category: "meditation",
        title: "Tapping Into Calm — EFT Crisis Protocol",
        description:
          "Emergency EFT tapping sequence for acute stress: karate chop point + full tapping round while voicing the specific feeling. Reduces physiological stress markers within 4 minutes.",
        link: "https://www.youtube.com/watch?v=dRFR7MJbg0Y",
        stressRange: "7-10",
      },
    ],
    music: [
      {
        category: "music",
        title: "Binaural Beats — 432 Hz Deep Stress Relief",
        description:
          "Use headphones. 432 Hz + delta wave binaural beats shift brainwaves from high-beta (stress) to alpha (calm). Effects begin within 7 minutes of continuous listening.",
        link: "https://www.youtube.com/watch?v=yFY-qwDXa4g",
        stressRange: "7-10",
      },
      {
        category: "music",
        title: "Weightless — Marconi Union (Scientifically Most Calming Song)",
        description:
          "Co-designed with sound therapists, proven in studies to reduce anxiety by 65% — more effective than massage or breathing exercises alone. Listen with eyes closed.",
        link: "https://www.youtube.com/watch?v=UfcAVejslrU",
        stressRange: "7-10",
      },
      {
        category: "music",
        title: "Delta Wave Sleep Music — Deep Stress Relief",
        description:
          "0.5–4 Hz delta binaural beats with ambient soundscape. Even during waking use, delta frequencies reduce cortisol, slow heart rate, and activate the parasympathetic system.",
        link: "https://www.youtube.com/watch?v=A2sS4bMcQbQ",
        stressRange: "7-10",
      },
      {
        category: "music",
        title: "40 Hz Gamma Waves — Focus & Calm",
        description:
          "Gamma frequency (40 Hz) stimulation has been shown in neuroscience research to reduce anxiety symptoms and improve cognitive clarity during high-stress episodes.",
        link: "https://www.youtube.com/watch?v=JFRHM49RZLg",
        stressRange: "7-10",
      },
    ],
    activity: [
      {
        category: "activity",
        title: "Cold Water Dive Reflex Reset",
        description:
          "Splash cold water on your face 3× or submerge your face in cold water for 15–30 seconds. Instantly triggers the mammalian dive reflex, slowing heart rate by up to 25% in seconds.",
        link: "https://www.youtube.com/watch?v=F6eFFCi12v8",
        stressRange: "7-10",
      },
      {
        category: "activity",
        title: "HIIT Cortisol Burn — 7-Minute Stress Release",
        description:
          "High-intensity movement metabolizes excess cortisol and adrenaline chemically. Jumping jacks, high knees, burpees — 30s on, 10s off for 7 minutes. The physical purge works.",
        link: "https://www.youtube.com/watch?v=mmq5zZfmIws",
        stressRange: "7-10",
      },
      {
        category: "activity",
        title: "Somatic Shaking — Trauma Release Exercise",
        description:
          "Stand and intentionally shake your body from feet upward for 5 minutes. Developed by Dr. David Berceli, this releases stored stress tension from the psoas muscle — the body's primary stress muscle.",
        link: "https://www.youtube.com/watch?v=FekmD7E3rNc",
        stressRange: "7-10",
      },
      {
        category: "activity",
        title: "Emergency Yoga — 10 Min Anxiety Release",
        description:
          "A targeted sequence of poses specifically chosen to lower cortisol: child's pose, legs-up-the-wall, seated forward fold. Activates the parasympathetic system through the pose-breath interaction.",
        link: "https://www.youtube.com/watch?v=hD1bY5wxiWg",
        stressRange: "7-10",
      },
    ],
    tip: [
      {
        category: "tip",
        title: "RAIN Technique for Overwhelm",
        description:
          "Recognize what's happening → Allow it to exist without fighting it → Investigate the body sensation with curiosity → Nurture yourself with a kind inner statement. Stops the overwhelm spiral.",
        link: "https://www.youtube.com/watch?v=u1ELrmO7bz8",
        stressRange: "7-10",
      },
      {
        category: "tip",
        title: "Window of Tolerance — Body Safety Script",
        description:
          "Place both hands on your chest, feel your heartbeat, and say: 'I am safe right now. This feeling is temporary. It will pass.' Somatic grounding activates the prefrontal cortex within 60 seconds.",
        link: "https://www.youtube.com/watch?v=SJzfy3GIiSg",
        stressRange: "7-10",
      },
      {
        category: "tip",
        title: "The 3-3-3 Crisis Rule",
        description:
          "Name 3 things you can see → 3 sounds you can hear → move 3 body parts (fingers, toes, shoulders). This sensorimotor protocol interrupts the fight-or-flight loop within 30 seconds.",
        link: "https://www.youtube.com/watch?v=30VMIEmA114",
        stressRange: "7-10",
      },
      {
        category: "tip",
        title: "One Small Controllable Action",
        description:
          "High stress magnifies helplessness. Immediately do ONE tiny thing within your control — make your bed, wash one dish, send one message. Restoring agency chemically dampens the stress response.",
        link: "https://www.youtube.com/watch?v=xRoFPMGKEDE",
        stressRange: "7-10",
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────
// SECTION 9 — NLP ANALYSIS ENGINE
// ─────────────────────────────────────────────────────────────────

interface TokenAnalysis {
  rawScore: number;
  dimensionScores: Record<string, number>;
  negationsFound: string[];
  intensifiersFound: string[];
  diminishersFound: string[];
  triggeredPhrases: Array<{ phrase: string; weight: number; dimension: string }>;
  emojiScore: number;
  punctuationBoost: number;
}

function getSortedLexiconKeys(): string[] {
  return Object.keys(LEXICON).sort((a, b) => {
    const aWords = a.split(" ").length;
    const bWords = b.split(" ").length;
    if (bWords !== aWords) return bWords - aWords;
    return a.localeCompare(b);
  });
}

const SORTED_LEXICON_KEYS = getSortedLexiconKeys();

/**
 * Scans text for emoji and returns cumulative stress delta.
 */
function scoreEmojis(text: string): number {
  let score = 0;
  for (const [emoji, delta] of Object.entries(EMOJI_STRESS_MAP)) {
    if (text.includes(emoji)) {
      // Count occurrences (repeated emojis intensify the signal)
      const count = (text.match(new RegExp(emoji, "g")) ?? []).length;
      score += delta * Math.min(count, 3); // cap at 3× to avoid gaming
    }
  }
  return score;
}

/**
 * Repeated exclamation marks or ALL-CAPS words boost intensity.
 */
function scorePunctuation(text: string): number {
  let boost = 0;
  const exclamationCount = (text.match(/!/g) ?? []).length;
  boost += Math.min(exclamationCount * 0.15, 0.6);

  // ALL CAPS words (3+ letters) indicate shouting/intensity
  const capsWords = (text.match(/\b[A-Z]{3,}\b/g) ?? []).length;
  boost += Math.min(capsWords * 0.2, 0.8);

  // Question marks suggesting uncertainty/distress
  const questionCount = (text.match(/\?/g) ?? []).length;
  boost += Math.min(questionCount * 0.05, 0.2);

  return boost;
}

function analyzeText(text: string): TokenAnalysis {
  const lower = text.toLowerCase();
  const dimensionScores: Record<string, number> = { V: 0, A: 0, C: 0, P: 0 };
  let rawScore = 0;

  const negationsFound: string[] = [];
  const intensifiersFound: string[] = [];
  const diminishersFound: string[] = [];
  const triggeredPhrases: Array<{ phrase: string; weight: number; dimension: string }> = [];

  const consumed: Array<[number, number]> = [];

  const isConsumed = (start: number, end: number): boolean =>
    consumed.some(([s, e]) => start < e && end > s);

  for (const phrase of SORTED_LEXICON_KEYS) {
    let searchStart = 0;
    let idx: number;

    while ((idx = lower.indexOf(phrase, searchStart)) !== -1) {
      const end = idx + phrase.length;

      const charBefore = idx > 0 ? lower[idx - 1] : " ";
      const charAfter = end < lower.length ? lower[end] : " ";
      const validBoundary = /\W/.test(charBefore) && /\W/.test(charAfter);

      if (!validBoundary || isConsumed(idx, end)) {
        searchStart = idx + 1;
        continue;
      }

      const entry = LEXICON[phrase];
      let weight = entry.weight;

      // Negation check (look back 4 words, ~40 chars)
      const contextBefore = lower.slice(Math.max(0, idx - 45), idx);
      const wordsBefore = contextBefore.trim().split(/\s+/).slice(-4);
      const negation = wordsBefore.find((w) => NEGATION_TOKENS.has(w));
      if (negation) {
        // Negation of positive = mild stress; negation of negative = relief
        weight = weight > 0 ? -weight * 0.7 : Math.abs(weight) * 0.5;
        negationsFound.push(negation);
      }

      // Intensifier / diminisher check (look back 2 words)
      const twoWordsBefore = wordsBefore.slice(-2);
      const twoWordPhrase = twoWordsBefore.join(" ");
      let modifier = 1.0;

      if (DIMINISHERS[twoWordPhrase]) {
        modifier = DIMINISHERS[twoWordPhrase];
        diminishersFound.push(twoWordPhrase);
      } else {
        for (const word of [...twoWordsBefore].reverse()) {
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

  const emojiScore = scoreEmojis(text);
  const punctuationBoost = scorePunctuation(text);

  return {
    rawScore,
    dimensionScores,
    negationsFound: [...new Set(negationsFound)],
    intensifiersFound: [...new Set(intensifiersFound)],
    diminishersFound: [...new Set(diminishersFound)],
    triggeredPhrases,
    emojiScore,
    punctuationBoost,
  };
}

// ─────────────────────────────────────────────────────────────────
// SECTION 10 — DOMAIN CLASSIFIER
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
// SECTION 11 — TEMPORAL URGENCY
// ─────────────────────────────────────────────────────────────────

function scoreTemporalUrgency(text: string): number {
  let total = 0;
  for (const { pattern, boost } of TEMPORAL_BOOST_PATTERNS) {
    if (pattern.test(text)) total += boost;
  }
  return Math.min(2.0, Math.max(-1.0, total));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 12 — SCORE NORMALIZATION
// ─────────────────────────────────────────────────────────────────

/**
 * Maps raw lexical score onto 0-10 using a calibrated sigmoid.
 * Raw ≈ 0  → ~5 (neutral)
 * Raw ≈ +12 → ~9 (high stress)
 * Raw ≈ -8  → ~2 (very calm)
 */
function normalizeRawScore(raw: number): number {
  const k = 0.32;
  const midpoint = 1.8;
  const sigmoid = 10 / (1 + Math.exp(-k * (raw - midpoint)));
  return Math.min(10, Math.max(0, sigmoid));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 13 — HISTORY ANCHOR
// ─────────────────────────────────────────────────────────────────

/**
 * If a rolling history average is provided, we use it as a weak anchor
 * to detect deviation (someone normally calm who's suddenly high is more
 * significant than baseline-high). Weight is intentionally low (10%).
 */
function computeHistoryAnchor(historyAverage?: number): number {
  if (historyAverage === undefined || historyAverage === null) return 5; // neutral
  return Math.min(10, Math.max(0, Number(historyAverage)));
}

// ─────────────────────────────────────────────────────────────────
// SECTION 14 — RECOMMENDATION SELECTOR
//   Always returns exactly 4 recommendations (one per category).
// ─────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: RecommendationCategory[] = ["meditation", "music", "activity", "tip"];

function selectRecommendations(
  band: StressBand,
  domain: LifeDomain,
  noteSeed: number,
): Recommendation[] {
  const pool = REC_LIBRARY[band];
  const affinityIndices = DOMAIN_PATTERNS[domain].affinityIndices;

  // For each category, pick the affinity-indexed item (or fallback to noteSeed)
  return ALL_CATEGORIES.map((category) => {
    const items = pool[category];
    const affinityIdx = affinityIndices[category] ?? 0;
    // Blend: use affinityIdx, but also allow seed rotation for variety
    const idx = (affinityIdx + (noteSeed % 2)) % items.length;
    return items[idx];
  });
}

// ─────────────────────────────────────────────────────────────────
// SECTION 15 — CONFIDENCE CALCULATOR
// ─────────────────────────────────────────────────────────────────

function calculateConfidence(
  selfReport: number,
  textScore: number,
  noteLength: number,
): { level: "high" | "medium" | "low"; divergence: number } {
  const divergence = Math.abs(selfReport - textScore);
  const hasSubstantialText = noteLength >= 30;

  let level: "high" | "medium" | "low";
  if (divergence <= 2 && hasSubstantialText)     level = "high";
  else if (divergence <= 4 || hasSubstantialText) level = "medium";
  else                                             level = "low";

  return { level, divergence };
}

// ─────────────────────────────────────────────────────────────────
// SECTION 16 — PUBLIC EXPORT
// ─────────────────────────────────────────────────────────────────

export async function analyzeMoodWithAI(
  inputData: MoodInput,
): Promise<AnalysisResult> {
  const {
    mood = "neutral",
    userStress = 5,
    note = "",
    historyAverage,
  } = inputData;

  // ── Signal 1: Self-report (weight 30%) ───────────────────────
  const selfReportScore = Math.min(10, Math.max(0, Number(userStress)));

  // ── Signal 2: Mood label (weight 15%) ────────────────────────
  const moodKey = mood.trim().toLowerCase();
  const moodProfile = MOOD_PROFILES[moodKey] ?? MOOD_PROFILES["neutral"];
  const moodLabelScore = Math.min(10, Math.max(0, 5 + moodProfile.stressOffset));

  // ── Signal 3: Deep text analysis (weight 45%) ────────────────
  const textAnalysis = analyzeText(note);
  const rawTextScore =
    textAnalysis.rawScore +
    textAnalysis.emojiScore +
    textAnalysis.punctuationBoost;
  const textScore = normalizeRawScore(rawTextScore);

  // ── Signal 4: History anchor (weight 10%) ────────────────────
  const historyAnchorScore = computeHistoryAnchor(historyAverage);

  // ── Domain detection & boost ──────────────────────────────────
  const domain = detectDomain(note);
  const domainBoost = DOMAIN_PATTERNS[domain].stressBoost;

  // ── Temporal urgency ──────────────────────────────────────────
  const temporalUrgencyBoost = scoreTemporalUrgency(note);

  // ── Dimensional sub-scores ────────────────────────────────────
  const { V = 0, A = 0, C = 0, P = 0 } = textAnalysis.dimensionScores;
  const emotionalValence    = parseFloat(V.toFixed(2));
  const arousalScore        = parseFloat(A.toFixed(2));
  const cognitiveLoadScore  = parseFloat(C.toFixed(2));
  const physicalCueScore    = parseFloat(P.toFixed(2));

  // ── Confidence ────────────────────────────────────────────────
  const { level: confidenceLevel, divergence } = calculateConfidence(
    selfReportScore,
    textScore,
    note.length,
  );

  // ── Adaptive weight blending ──────────────────────────────────
  // When text and self-report diverge heavily, trust text more
  // (people under-report on sliders; the written note is harder to fake).
  const isLowConfidence = confidenceLevel === "low";
  const textWeight    = isLowConfidence ? 0.55 : 0.45;
  const selfWeight    = isLowConfidence ? 0.22 : 0.30;
  const moodWeight    = isLowConfidence ? 0.13 : 0.15;
  const historyWeight = isLowConfidence ? 0.10 : 0.10;

  const blendedRaw =
    selfWeight    * selfReportScore    +
    moodWeight    * moodLabelScore     +
    textWeight    * textScore          +
    historyWeight * historyAnchorScore +
    domainBoost                        +
    temporalUrgencyBoost;

  const finalStressLevel = Math.min(10, Math.max(0, Math.round(blendedRaw)));

  // ── Band ──────────────────────────────────────────────────────
  const stressBand: StressBand =
    finalStressLevel <= 3 ? "low"      :
    finalStressLevel <= 6 ? "moderate" :
    "high";

  // ── Sentiment score ───────────────────────────────────────────
  const aiSentimentScore = parseFloat((finalStressLevel / 10).toFixed(2));

  // ── Recommendations — ALWAYS all 4 categories ────────────────
  const recommendations = selectRecommendations(stressBand, domain, note.length);

  // ── Debug payload ─────────────────────────────────────────────
  const debug: AnalysisDebug = {
    selfReportScore,
    moodLabelScore,
    textScore:            parseFloat(textScore.toFixed(2)),
    textRawScore:         parseFloat(rawTextScore.toFixed(2)),
    historyAnchorScore,
    emojiScore:           parseFloat(textAnalysis.emojiScore.toFixed(2)),
    punctuationBoost:     parseFloat(textAnalysis.punctuationBoost.toFixed(2)),
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

export { analyzeMoodWithAI as analyzeMood };