import { icons } from "../../../shared/assets/icons/icons";

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
      cardBg: "bg-rose-50/70",
      cardBorder: "border-rose-100",
      innerBg: "bg-white/90",
      iconWrapperBg: "bg-rose-100/60",
      tint: "tint-rose-600",
    },
    2: {
      title: "A bit low or tense",
      description:
        "Be gentle with yourself. Small actions can help clear your mind.",
      icon: icons.mood_bad_outline,
      cardBg: "bg-amber-50/70",
      cardBorder: "border-amber-100",
      innerBg: "bg-white/90",
      iconWrapperBg: "bg-amber-100/60",
      tint: "tint-amber-600",
    },
    3: {
      title: "Feeling balanced",
      description:
        "You're holding a steady baseline today. Keep moving mindfully.",
      icon: icons.mood_neutral_outline,
      cardBg: "bg-slate-50",
      cardBorder: "border-slate-200",
      innerBg: "bg-white/80",
      iconWrapperBg: "bg-slate-100",
      tint: "tint-slate-500",
    },
    4: {
      title: "Feeling good",
      description: "Keep your positive energy going strong throughout the day.",
      icon: icons.mood_good_outline,
      cardBg: "bg-emerald-50/60",
      cardBorder: "border-emerald-100",
      innerBg: "bg-white/80",
      iconWrapperBg: "bg-emerald-100/50",
      tint: "tint-emerald-600",
    },
    5: {
      title: "Feeling excellent!",
      description:
        "Thriving and full of peace! Wonderful moment to journal your joy.",
      icon: icons.mood_great_outline,
      cardBg: "bg-indigo-50/60",
      cardBorder: "border-indigo-100",
      innerBg: "bg-white/80",
      iconWrapperBg: "bg-indigo-100/50",
      tint: "tint-indigo-600",
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
    1: { screenBg: "#FFF3E0", scrollBg: "#FFF3E0" }, // warm amber (overwhelmed)
    2: { screenBg: "#FFF8E1", scrollBg: "#FFF8E1" }, // soft amber-yellow (tense)
    3: { screenBg: "#F5F5F0", scrollBg: "#F5F5F0" }, // neutral slate (balanced)
    4: { screenBg: "#F1F8F4", scrollBg: "#F1F8F4" }, // fresh green-white (good)
    5: { screenBg: "#EEF2FF", scrollBg: "#EEF2FF" }, // calm indigo-white (excellent)
  };
  return configs[rating] ?? configs[3];
};