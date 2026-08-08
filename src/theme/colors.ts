import tokens from "./tokens.json";

export const commonColors = tokens.colors.common;
export const studentColors = tokens.colors.student;
export const calmColors = tokens.colors.calm;
export const counselorColors = tokens.colors.counselor;
export const moodColors = tokens.colors.mood;
export const avatarColors = tokens.colors.avatar;

export const colors = tokens.colors;

export type StudentColorToken = keyof typeof studentColors;
export type CalmColorToken = keyof typeof calmColors;
export type CounselorColorToken = keyof typeof counselorColors;
