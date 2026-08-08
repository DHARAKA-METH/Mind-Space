const tokens = require("./src/theme/tokens.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        app: tokens.colors.student,
        calm: tokens.colors.calm,
        counselor: tokens.colors.counselor,
        mood: tokens.colors.mood,
        selected: tokens.colors.common.controlSelected,
      },
      fontFamily: {
        sans: [tokens.typography.fontFamily.regular],
        regular: [tokens.typography.fontFamily.regular],
        semibold: [tokens.typography.fontFamily.semiBold],
        display: [tokens.typography.fontFamily.display],
      },
      fontSize: {
        caption: [tokens.typography.fontSize.caption, { lineHeight: `${tokens.typography.lineHeight.caption}px` }],
        "body-sm": [tokens.typography.fontSize.bodySmall, { lineHeight: `${tokens.typography.lineHeight.bodySmall}px` }],
        body: [tokens.typography.fontSize.body, { lineHeight: `${tokens.typography.lineHeight.body}px` }],
        "body-lg": [tokens.typography.fontSize.bodyLarge, { lineHeight: `${tokens.typography.lineHeight.bodyLarge}px` }],
        subtitle: [tokens.typography.fontSize.subtitle, { lineHeight: `${tokens.typography.lineHeight.subtitle}px` }],
        title: [tokens.typography.fontSize.title, { lineHeight: `${tokens.typography.lineHeight.title}px` }],
        heading: [tokens.typography.fontSize.heading, { lineHeight: `${tokens.typography.lineHeight.heading}px` }],
        display: [tokens.typography.fontSize.display, { lineHeight: `${tokens.typography.lineHeight.display}px` }],
      },
      spacing: {
        screen: tokens.spacing.screen,
      },
      borderRadius: {
        card: tokens.radii.xl,
        panel: tokens.radii.xxl,
      },
    },
  },
  plugins: [],
};
