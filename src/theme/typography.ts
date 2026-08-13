import type { TextStyle } from "react-native";

import tokens from "./tokens.json";

export const fontFamily = tokens.typography.fontFamily;
export const fontSize = tokens.typography.fontSize;
export const lineHeight = tokens.typography.lineHeight;
export const letterSpacing = tokens.typography.letterSpacing;
export const fontWeight = tokens.typography.fontWeight as Record<
  keyof typeof tokens.typography.fontWeight,
  NonNullable<TextStyle["fontWeight"]>
>;

export const typography = {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
} as const;

export const textStyles = {
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.bodySmall,
    lineHeight: lineHeight.bodySmall,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },
  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.bodyLarge,
    lineHeight: lineHeight.bodyLarge,
  },
  subtitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.subtitle,
    lineHeight: lineHeight.subtitle,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.title,
    lineHeight: lineHeight.title,
  },
  heading: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.heading,
    lineHeight: lineHeight.heading,
  },
  display: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
  },
} satisfies Record<string, TextStyle>;
