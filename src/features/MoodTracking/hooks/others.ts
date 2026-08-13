import { icons } from "../../../shared/assets/icons/icons";
import { moodColors, studentColors } from "@/src/theme";

export const getMoodSummaryConfig = (avg: number) => {
  const rating = Math.min(Math.max(Math.round(avg), 1), 5);

  const configs: Record<
    number,
    {
      title: string;
      description: string;
      icon: any;
      cardBg: string;
      cardBorder: string;
      innerBg: string;
      iconWrapperBg: string;
      tint: string;
    }
  > = {
    1: {
      title: "Feeling overwhelmed",
      description:
        "Take a deep breath. Let's try a quick grounding exercise together.",
      icon: icons.mood_awful_outline,
      cardBg: "bg-mood-awfulSoft/70",
      cardBorder: "border-mood-awful/20",
      innerBg: "bg-app-surface/90",
      iconWrapperBg: "bg-mood-awfulSoft/60",
      tint: "tint-mood-awful",
    },
    2: {
      title: "A bit low or tense",
      description:
        "Be gentle with yourself. Small actions can help clear your mind.",
      icon: icons.mood_bad_outline,
      cardBg: "bg-mood-badSoft/70",
      cardBorder: "border-mood-bad/20",
      innerBg: "bg-app-surface/90",
      iconWrapperBg: "bg-mood-badSoft/60",
      tint: "tint-mood-bad",
    },
    3: {
      title: "Feeling balanced",
      description:
        "You're holding a steady baseline today. Keep moving mindfully.",
      icon: icons.mood_neutral_outline,
      cardBg: "bg-mood-neutralSoft",
      cardBorder: "border-mood-neutral/20",
      innerBg: "bg-app-surface/80",
      iconWrapperBg: "bg-mood-neutralSoft",
      tint: "tint-mood-neutral",
    },
    4: {
      title: "Feeling good",
      description: "Keep your positive energy going strong throughout the day.",
      icon: icons.mood_good_outline,
      cardBg: "bg-mood-goodSoft/60",
      cardBorder: "border-mood-good/20",
      innerBg: "bg-app-surface/80",
      iconWrapperBg: "bg-mood-goodSoft/50",
      tint: "tint-mood-good",
    },
    5: {
      title: "Feeling excellent!",
      description:
        "Thriving and full of peace! Wonderful moment to journal your joy.",
      icon: icons.mood_great_outline,
      cardBg: "bg-mood-greatSoft/60",
      cardBorder: "border-mood-great/20",
      innerBg: "bg-app-surface/80",
      iconWrapperBg: "bg-mood-greatSoft/50",
      tint: "tint-mood-great",
    },
  };

  return configs[rating];
};

export const getBackgroundConfig = (
  rating: number,
): {
  screenBg: string;
  scrollBg: string;
} => {
  const configs: Record<number, { screenBg: string; scrollBg: string }> = {
    1: { screenBg: moodColors.awfulSoft, scrollBg: moodColors.awfulSoft },
    2: { screenBg: moodColors.badSoft, scrollBg: moodColors.badSoft },
    3: { screenBg: moodColors.neutralSoft, scrollBg: moodColors.neutralSoft },
    4: { screenBg: moodColors.goodSoft, scrollBg: moodColors.goodSoft },
    5: { screenBg: studentColors.primarySoft, scrollBg: studentColors.primarySoft },
  };
  return configs[rating] ?? configs[3];
};
