const LEGACY_GLYPH_DISPLAY_MAP: Record<string, string> = {
	'\u{F8FF0}': '⿰亻壯',
};

const LEGACY_GLYPH_LOOKUP_MAP: Record<string, string> = {
	'\u{F8FF0}': '壯',
};

function replaceByMap(input: string, map: Record<string, string>): string {
	let output = String(input || '');
	for (const [source, replacement] of Object.entries(map)) {
		output = output.split(source).join(replacement);
	}
	return output;
}

export function replaceLegacyGlyphsForDisplay(input: string): string {
	return replaceByMap(input, LEGACY_GLYPH_DISPLAY_MAP);
}

export function normalizeLegacyGlyphsForLookup(input: string): string {
	return replaceByMap(input, LEGACY_GLYPH_LOOKUP_MAP);
}
