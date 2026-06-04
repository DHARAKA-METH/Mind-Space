const riskWords = [
  "suicide",
  "kill myself",
  "self harm"
];

export function detectRisk(note: string) {
  const text = note.toLowerCase();

  return riskWords.some(word =>
    text.includes(word)
  );
}