import "jest-extended";

declare global {
	/**
	 * An array that always contains at least one element.
	 */
	type NonEmptyArray<T> = [T, ...Array<T>];

	/**
	 * A function which determines the type identity of the given value.
	 */
	type TypeGuard<T> = (tbd: unknown) => tbd is T;

	/**
	 * The element type of the given array.
	 */
	type GetArrayElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer U>
		? U
		: never;

	/**
	 * Removes `null` cases from the keys of a given object.
	 */
	type NonNull<T> = { [P in keyof T]: Exclude<T[P], null> };

	/**
	 * Replaces values of the given object and keys with the given value;
	 */
	type Replace<T, K extends keyof T, TReplace> = Pick<T, Exclude<keyof T, K>> & {
		[P in K]: TReplace;
	};
}
