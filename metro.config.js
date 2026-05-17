const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// SVG SUPPORT (SAFE WAY)
config.transformer.babelTransformerPath =
  require.resolve("react-native-svg-transformer");

// only remove svg from assetExts
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg",
);

// add svg to sourceExts
config.resolver.sourceExts.push("svg");

// NativeWind
module.exports = withNativeWind(config, {
  input: "./global.css",
});
