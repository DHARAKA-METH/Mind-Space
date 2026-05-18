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