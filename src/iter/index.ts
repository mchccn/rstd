import { toIter } from "./helpers/toIter.js";
import type { IterResolvable } from "./types.js";

export const iter = <T = never>(i?: IterResolvable<T>) => {
    if (typeof i === "undefined") return toIter([]);

    return toIter(i);
};

console.log(iter([1, 2]).cmp([1, 2]));
