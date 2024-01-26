import type { ReadonlyTuple } from "type-fest";

export function isNonEmptyArray<T>(array: ReadonlyArray<T>): array is NonEmptyArray<T> {
	return array.length > 0;
}

export function isNotNull<T>(tbd: T): tbd is Exclude<T, null> {
	return tbd !== null;
}

export function isObject(tbd: unknown): tbd is Record<string, unknown> {
	return typeof tbd === "object" && tbd !== null && !Array.isArray(tbd);
}

export function isBoolean(tbd: unknown): tbd is boolean {
	return tbd !== null && (typeof tbd === "boolean" || tbd instanceof Boolean);
}

export function isNumber(tbd: unknown): tbd is number {
	return tbd !== null && (typeof tbd === "number" || tbd instanceof Number);
}

export function isString(tbd: unknown): tbd is string {
	return tbd !== null && (typeof tbd === "string" || tbd instanceof String);
}

export function isUrlString(tbd: unknown): tbd is string {
	if (!isString(tbd)) return false;

	try {
		new URL(tbd); // throws if not a URL string
		return true;
	} catch {
		return false;
	}
}

export function isArrayOfLength<Element, Length extends number>(
	array: ReadonlyArray<Element>,
	length: Length
): array is ReadonlyTuple<Element, Length> {
	return array.length === length;
}
