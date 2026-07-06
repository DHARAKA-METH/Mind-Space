type EmotionLabel = 'angry' | 'fear' | 'sad' | 'neutral' | 'happy';

type Emotion = {
  label: EmotionLabel;
  score: number;
};

export const calculateStressLevel10 = (emotions: Emotion[]) => {
  const weights: Record<EmotionLabel, number> = {
    angry: 1.0,
    fear: 0.9,
    sad: 0.6,
    neutral: 0.2,
    happy: 0.0,
  };

  let stress = 0;

  emotions.forEach((e) => {
    const weight = weights[e.label]  ?? 0;
    stress += e.score * weight;
  });

  // convert to 0–10 scale
  let level10 = Math.round(stress * 10);

  // clamp between 1–10
  level10 = Math.min(Math.max(level10, 1), 10);

  return level10;
};