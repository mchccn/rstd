import type { Option } from "../option/index.js";
import { toIter } from "./helpers/toIter.js";
import type { IterResolvable } from "./types.js";

export const iter = <T = never>(i?: IterResolvable<T>) => toIter(i ?? []);

export const empty = () => iter();

export const from_fn = <T>(f: () => Option<T>) =>
    toIter({
        next() {
            const opt = f.call(undefined);

            return opt.is_none() ? { value: undefined, done: true } : { value: opt.unwrap(), done: false };
        },
    });

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
    toIter<T>(
        (function* () {
            while (true) yield repeater.call(undefined);
        })(),
    );

export const successors = <T>(first: Option<T>, succ: (item: T) => Option<T>) =>
    toIter(
        (function* () {
            if (first.is_none()) return;

            let last = first;

            do {
                yield last.unwrap();

                last = succ.call(undefined, last.unwrap());
            } while (last.is_some());
        })(),
    );

export const zip = <A, B>(a: IterResolvable<A>, b: IterResolvable<B>) => toIter(a).zip(b);
