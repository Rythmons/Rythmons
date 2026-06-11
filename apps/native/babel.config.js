module.exports = (api) => {
	api.cache(true);
	const plugins = [];

	plugins.push([
		"@tamagui/babel-plugin",
		{
			components: ["tamagui"],
			config: "./tamagui.config.ts",
		},
	]);
	plugins.push("react-native-worklets/plugin");

	return {
		presets: [
			["babel-preset-expo", { jsxImportSource: "nativewind" }],
			"nativewind/babel",
		],
		plugins,
	};
};
