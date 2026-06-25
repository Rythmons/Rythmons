const JAWG_ACCESS_TOKEN = process.env.NEXT_PUBLIC_JAWG_ACCESS_TOKEN ?? "";

const JAWG_THEME_IDS = [
	"jawg-streets",
	"jawg-lagoon",
	"jawg-sunny",
	"jawg-terrain",
	"jawg-light",
	"jawg-dark",
] as const;

const CARTO_THEME_STYLES: Record<string, string> = {
	voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
	positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
	"dark-matter":
		"https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
	"voyager-nolabels":
		"https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json",
	"positron-nolabels":
		"https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
	"dark-matter-nolabels":
		"https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json",
};

/** Modifier cet id pour changer le thème de toutes les cartes */
export const ACTIVE_THEME_ID = "jawg-streets";

export function jawgStyleUrl(styleId: string): string {
	return `https://api.jawg.io/styles/${styleId}.json?access-token=${JAWG_ACCESS_TOKEN}&lang=fr`;
}

export function resolveMapStyle(themeId: string): string {
	if ((JAWG_THEME_IDS as readonly string[]).includes(themeId)) {
		if (!JAWG_ACCESS_TOKEN) {
			return CARTO_THEME_STYLES.voyager;
		}
		return jawgStyleUrl(themeId);
	}

	return CARTO_THEME_STYLES[themeId] ?? CARTO_THEME_STYLES.voyager;
}

export const MAP_STYLE = resolveMapStyle(ACTIVE_THEME_ID);

export const MAP_MARKER_STYLE = {
	background: "#18181b",
	border: "2.5px solid #ffffff",
	size: 18,
} as const;
