import { Iter } from "../Iter.js";
import type { IterResolvable } from "../types.js";

const unableToConvert = new TypeError(`unable to convert this value to Iter<T>`);

export function toIter<T>(source: IterResolvable<T>): Iter<T>;
export function toIter(source: unknown): Iter<unknown>;
export function toIter(source: unknown) {
    if (!source || typeof source !== "object") throw unableToConvert;

    if (source instanceof Iter) return source;

    if (Symbol.iterator in source && typeof Reflect.get(source, Symbol.iterator) === "function")
        return new Iter(Reflect.get(source, Symbol.iterator).call(source));

    if ("next" in source && Reflect.get(source, "next") === "function") {
        const next = Reflect.get(source, "next").bind(source);

        return new Iter(
            (function* () {
                let el;

                do {
                    el = next();

                    if (!el.done) yield el.value;
                } while (!el.done);
            })(),
        );
    }

    throw unableToConvert;
}
