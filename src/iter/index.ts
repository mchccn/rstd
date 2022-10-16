import { toIter } from "./helpers/toIter.js";
import type { IterResolvable } from "./types.js";

export const iter = <T = never>(i?: IterResolvable<T>) => toIter(i ?? []);

export const empty = () => iter();

//TODO: need Option<T> type
export const from_fn = <T, R>(f: () => IteratorResult<T, R>) => toIter({ next: f });

export const from_generator = <T, R, N>(generator: Generator<T, R, N>) => toIter(generator);

export const once = <T>(value: T) => toIter([value]);

export const once_with = <T>(gen: () => T) =>
    toIter(
        (function* () {
            yield gen.call(undefined);
        })(),
    );

export const repeat = <T>(elt: T) =>
    toIter(
        (function* () {
            while (true) yield structuredClone(elt);
        })(),
    );

export const repeat_with = <T>(repeater: () => T) =>
    toIter(
        (function* () {
            while (true) yield repeater.call(undefined);
        })(),
    );

//TODO: need Option<T> type
export const successors = <T>(first: T, succ: (item: T) => T) =>
    toIter(
        (function* () {
            //
        })(),
    );

export const zip = <A, B>(a: IterResolvable<A>, b: IterResolvable<B>) => toIter(a).zip(b);

console.log(
    repeat_with(() => empty())
        .take(5)
        .collect(),
);
console.log(
    Array(5)
        .fill(0)
        .map(() => empty()),
);
