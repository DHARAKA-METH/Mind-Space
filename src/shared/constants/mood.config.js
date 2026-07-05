// shared/constants/mood.config.js
import { icons } from "../assets/icons/icons";

export const MOOD_CONFIG = {
  awful:   { label: "Awful",   stress: 10, color: "#DC3C3C", icon: icons.newico_mood_awful_filled },
  bad:     { label: "Bad",     stress: 8,  color: "#E67832", icon: icons.newico_mood_bad_filled },
  neutral: { label: "Neutral", stress: 5,  color: "#C8B43C", icon: icons.newico_mood_neutral_filled },
  good:    { label: "Good",    stress: 3,  color: "#50BE64", icon: icons.newico_mood_good_filled },
  great:   { label: "Great",   stress: 1,  color: "#32A0E6", icon: icons.newico_mood_great_filled },
};

export const MOOD_ORDER = ["awful", "bad", "neutral", "good", "great"];
export const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// ADD THIS SECTION BELOW:
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];


export const moods = [
  {
    id: "Awful",
    label: "Awful",
    bg: "#F7DDD6",       // warm muted rose — signals discomfort without alarm
    color: "#B5555C",    // accent: dusty red
    icon: icons.mood_awful_filled,
    outline: icons.mood_awful_outline,
  },
  {
    id: "Bad",
    label: "Bad",
    bg: "#F4E3CE",       // warm sand-terracotta — matches app's terracotta family
    color: "#C97B4A",    // accent: terracotta (reuses existing ceylon.terracotta)
    icon: icons.mood_bad_filled,
    outline: icons.mood_bad_outline,
  },
  {
    id: "Meh",
    label: "Meh",
    bg: "#EDE6D9",       // neutral warm sand — sits at the exact midpoint
    color: "#B8A78C",    // accent: muted taupe (reuses ceylon.mutedLight)
    icon: icons.mood_neutral_filled,
    outline: icons.mood_neutral_outline,
  },
  {
    id: "Good",
    label: "Good",
    bg: "#DCEBDD",       // soft sage-green — calm, positive
    color: "#7C9885",    // accent: sage
    icon: icons.mood_good_filled,
    outline: icons.mood_good_outline,
  },
  {
    id: "Great",
    label: "Great",
    bg: "#CFE3D2",       // deeper sage-green — most saturated positive tone
    color: "#4A7856",    // accent: tea green (reuses ceylon.teaGreen)
    icon: icons.mood_great_filled,
    outline: icons.mood_great_outline,
  },
];