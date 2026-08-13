import { Text, TextProps } from "react-native";

import { typography } from "@/src/theme";

export type AppTextProps = TextProps;

export default function AppText({ style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: typography.fontFamily.regular },
        style,
      ]}
    />
  );
}
