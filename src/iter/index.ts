import { toIter } from "./helpers/toIter.js";
import type { IterResolvable } from "./types.js";

export const iter = <T = never>(i?: IterResolvable<T>) => toIter(i ?? []);

export const empty = () => iter();

//TODO: need Option<T> type
export const from_fn = <T, R>(f: () => IteratorResult<T, R>) => toIter({ next: f });
