// shared/constants/mood.config.js
import { icons } from "../assets/icons/icons";
import { moodColors } from "@/src/theme";

export const MOOD_CONFIG = {
  awful:   { label: "Awful",   stress: 10, color: moodColors.awful, icon: icons.newico_mood_awful_filled },
  bad:     { label: "Bad",     stress: 8,  color: moodColors.bad, icon: icons.newico_mood_bad_filled },
  neutral: { label: "Neutral", stress: 5,  color: moodColors.neutral, icon: icons.newico_mood_neutral_filled },
  good:    { label: "Good",    stress: 3,  color: moodColors.good, icon: icons.newico_mood_good_filled },
  great:   { label: "Great",   stress: 1,  color: moodColors.great, icon: icons.newico_mood_great_filled },
};

export const MOOD_ORDER = ["awful", "bad", "neutral", "good", "great"];
export const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];


export const moods = [
  {
    id: "Awful",
    label: "Awful",
    bg: moodColors.awfulSoft,
    color: moodColors.awful,
    icon: icons.mood_awful_filled,
    outline: icons.mood_awful_outline,
  },
  {
    id: "Bad",
    label: "Bad",
    bg: moodColors.badSoft,
    color: moodColors.bad,
    icon: icons.mood_bad_filled,
    outline: icons.mood_bad_outline,
  },
  {
    id: "Meh",
    label: "Meh",
    bg: moodColors.neutralSoft,
    color: moodColors.neutral,
    icon: icons.mood_neutral_filled,
    outline: icons.mood_neutral_outline,
  },
  {
    id: "Good",
    label: "Good",
    bg: moodColors.goodSoft,
    color: moodColors.good,
    icon: icons.mood_good_filled,
    outline: icons.mood_good_outline,
  },
  {
    id: "Great",
    label: "Great",
    bg: moodColors.greatSoft,
    color: moodColors.great,
    icon: icons.mood_great_filled,
    outline: icons.mood_great_outline,
  },
];

/* -------------------------------------------------------------------------- */
/*                             WELLNESS MESSAGES                              */
/* -------------------------------------------------------------------------- */

/** @type {Record<string, { title: string; subtitle: string; button: string }>} */
export const WELLNESS_MESSAGES = {
  Awful: {
    title: "Give yourself a gentle moment",
    subtitle:
      "Explore calming resources selected to help you slow down and feel supported.",
    button: "Find something calming",
  },
  Bad: {
    title: "Take a small break",
    subtitle:
      "A relaxing activity may help you create a little space from how you're feeling.",
    button: "Help me relax",
  },
  Meh: {
    title: "How about a little reset?",
    subtitle:
      "Explore music, activities and simple wellness resources for your current mood.",
    button: "Refresh my mood",
  },
  Good: {
    title: "Keep this balance going",
    subtitle:
      "Relax with something enjoyable and continue your positive momentum.",
    button: "Explore wellness",
  },
  Great: {
    title: "Keep the good energy going",
    subtitle:
      "Discover something relaxing or uplifting that matches how you're feeling.",
    button: "Find something for me",
  },
};
