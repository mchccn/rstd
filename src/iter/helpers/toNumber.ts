import type { NumberResolvable } from "../../types.js";

const unableToConvert = new TypeError(`unable to convert this value to a number`);

export function toNumber(source: NumberResolvable): number;
export function toNumber(source: unknown): number;
export function toNumber(source: unknown) {
    if (source === null || typeof source === "undefined" || typeof source === "string") throw unableToConvert;

    if (typeof source === "number") return source;

    if (typeof source === "object") {
        if ("valueOf" in source && typeof Reflect.get(source, "valueOf") === "function")
            return Reflect.get(source, "valueOf")();

        if (Symbol.toPrimitive in source && typeof Reflect.get(source, Symbol.toPrimitive) === "function")
            return Reflect.get(source, Symbol.toPrimitive)();
    }

    throw unableToConvert;
}
