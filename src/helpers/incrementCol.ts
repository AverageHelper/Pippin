/**
 * Takes a column index and increments it.
 *
 * @example
 * ```ts
 * const colA = "A";
 * const colB = incrementCol(colA);
 * console.log(colB); // "B"
 *
 * const colZ = "Z";
 * const colAA = incrementCol(colZ);
 * console.log(colAA); // "AA"
 * ```
 */
export function incrementCol(col: string): string {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const END = alphabet.at(-1);

	// Uppercase, and strip non-alpha chars
	const onlyAlpha = col.toUpperCase().replaceAll(/[^A-Z]/giu, "");

	// Increment a single character
	if (onlyAlpha.length === 1) {
		const index = Array.from(alphabet).indexOf(onlyAlpha);
		return alphabet[index + 1] ?? "AA";
	}

	// If last char is Z, increment the string, and add A to the end
	if (onlyAlpha.at(-1) === END) {
		return incrementCol(onlyAlpha.slice(0, -1)).concat(alphabet[0] ?? "A");
	}

	// If last char is not Z, increment the last char
	return onlyAlpha.slice(0, -1).concat(incrementCol(onlyAlpha.at(-1) ?? ""));
}
