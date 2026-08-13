import tokens from "./tokens.json";

export const spacing = tokens.spacing;
export const radii = tokens.radii;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radii;
