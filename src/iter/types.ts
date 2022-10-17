import type { Iter } from "./Iter.js";

export type IterResolvable<T> =
    | Iter<T>
    | Iterator<T, unknown, undefined>
    | { [Symbol.iterator]: Iterator<T, unknown, undefined> }
    | readonly T[];

export type Ord = -1 | 0 | 1;

export type NumberResolvable = number | { valueOf(): number } | { [Symbol.toPrimitive](): number };
