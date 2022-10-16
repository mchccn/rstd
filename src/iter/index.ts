import { toIter } from "./helpers/toIter.js";
import type { IterResolvable } from "./types.js";

export const iter = <T = never>(i?: IterResolvable<T>) => {
    if (typeof i === "undefined") return toIter([]);

    return toIter(i);
};

const a = iter([1, 2, 3, 4, 5, 6, 7, 8, 9]).take_while((x) => x < 5);

console.log(a.next());
console.log(a.next());
console.log(a.next());
console.log(a.next());
console.log(a.next());
console.log(a.next());
console.log(a.next());
console.log(a.next());
console.log(a.next());
console.log(a.next());
