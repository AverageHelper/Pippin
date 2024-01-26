import type { Context, Failure, Struct } from "superstruct";
import { StructError, assert, coerce, define, nonempty, string } from "superstruct";

function messageFromUnknownError(error: unknown): string {
	let message: string;
	if (error instanceof Error) {
		message = error.message;
	} else if (typeof error === "string") {
		message = error;
	} else {
		message = JSON.stringify(error);
	}
	return message;
}

function failure(params: { error: unknown; value: unknown; context: Context }): Partial<Failure> {
	const { error, value, context } = params;
	return {
		value,
		message: messageFromUnknownError(error),
		branch: context.branch,
		path: context.path
	};
}

const urlSchema = define<URL>("url", (value, context) => {
	// Check if nonempty string
	try {
		assert(value, nonempty(string()));
	} catch (error) {
		// Not a string, or string was empty
		if (error instanceof StructError) return error;
		return failure({ error, value, context });
	}

	// Check if URL
	try {
		new URL(value);
		return true;
	} catch (error) {
		// Not a URL
		return failure({ error, value, context });
	}
});

export function url(): Struct<URL, null> {
	return coerce<URL, null, string>(urlSchema, string(), value => new URL(value));
}
