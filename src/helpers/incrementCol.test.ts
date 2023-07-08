import { incrementCol } from "./incrementCol";

describe("Increment Row Index", () => {
	const normalCases = [
		["A", "B"],
		["B", "C"],
		["X", "Y"],
		["Y", "Z"],
		["Z", "AA"],
		["AA", "AB"],
		["AB", "AC"],
		["ZX", "ZY"],
		["ZY", "ZZ"],
		["ZZ", "AAA"],
		["AAA", "AAB"],
		["AAB", "AAC"]
	] as const;
	test.each(normalCases)("Increments '%s' to '%s'", (a, b) => {
		expect(incrementCol(a)).toBe(b);
	});

	const oddCases = [
		["A1", "B"],
		["B  ", "C"],
		["x", "Y"],
		["1Y", "Z"],
		["Z", "AA"],
		["~Aa", "AB"],
		["Ab", "AC"],
		["zX", "ZY"],
		["Zy", "ZZ"],
		["Z Z", "AAA"],
		["Aa223A", "AAB"],
		["A   AB", "AAC"]
	] as const;
	test.each(oddCases)("Increments '%s' to '%s'", (a, b) => {
		expect(incrementCol(a)).toBe(b);
	});
});
