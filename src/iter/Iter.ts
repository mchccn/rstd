import deepEqual from "deep-equal";
import { None, Option, Some } from "../option/index.js";
import { Err, Ok, Result } from "../result/Result.js";
import type { IterResolvable, NumberResolvable, Ord } from "../types.js";
import { Namespaced } from "../utils/namespaced.js";
import { ResolveTo, UseResolvables } from "../utils/resolvable.js";
import { cloned } from "./helpers/cloned.js";
import { toIter } from "./helpers/toIter.js";
import { toNumber } from "./helpers/toNumber.js";

@UseResolvables()
@Namespaced("Iter<T>", { errors: true })
export class Iter<T> {
    #iter: Iterator<T, unknown, undefined>;

    #consumed = false;

    #fused = { called: false, dead: false };

    constructor(i: Iterator<T, unknown, undefined>) {
        this.#iter = i;
    }

    next(): Option<T> {
        if (this.#consumed) throw new ReferenceError(`this iterator has been consumed and cannot be used`);

        if (this.#fused.dead) return None;

        const { value, done } = this.#iter.next();

        if (this.#fused.called && typeof value === "undefined") this.#fused.dead = true;

        return !done ? Some(value) : None;
    }

    next_if(func: (item: T) => boolean): Option<T> {
        const item = this.peek();

        if (item.is_none()) return None;

        if (func.call(undefined, item.unwrap())) return this.next();

        return None;
    }

    next_if_eq(expected: T): Option<T> {
        return this.next_if((item) => deepEqual(item, expected));
    }

    advance_by(n: number): Result<undefined, number> {
        if (n < 0 || !Number.isInteger(n)) throw new TypeError(`n is not a nonnegative integer`);

        for (let i = 0, item; i < n; i++, item = this.next()) {
            if (item?.is_none()) return Err(i); // Err
        }

        return Ok(undefined); // Ok
    }

    all(f: (item: T) => boolean): boolean {
        let item = this.next();

        while (item.is_some()) {
            if (!f.call(undefined, item.unwrap())) return false;

            item = this.next();
        }

        return true;
    }

    any(f: (item: T) => boolean): boolean {
        let item = this.next();

        while (item.is_some()) {
            if (f.call(undefined, item.unwrap())) return true;

            item = this.next();
        }

        return false;
    }

    chain(other: IterResolvable<T>): Iter<T>;
    chain(@ResolveTo(Iter) other: Iter<T>) {
        this.#consumed = true;
        other.#consumed = true;

        return new Iter({
            next: function (this: Iter<T>) {
                const { value, done } = this.#iter.next();

                if (done) return other.#iter.next();

                return { value, done };
            }.bind(this),
        });
    }

    cloned(): Iter<T> {
        const [next, done] = cloned(this.#iter);

        this.#iter = (function* () {
            while (true) {
                const x = next(0);

                if (x === done) break;

                yield x;
            }
        })();

        return new Iter(
            (function* () {
                while (true) {
                    const x = next(1);

                    if (x === done) break;

                    yield structuredClone(x);
                }
            })(),
        );
    }

    cmp(other: IterResolvable<T>): [T] extends [number] ? Ord : never;
    cmp(@ResolveTo(Iter) other: Iter<T>) {
        return this.cmp_by(other, (a, b) => +a - +b);
    }

    cmp_by(other: IterResolvable<T>, cmp: (self: T, other: T) => number): Ord;
    cmp_by(@ResolveTo(Iter) other: Iter<T>, cmp: (self: T, other: T) => number) {
        let a, b;
        while (!a?.is_none() && !b?.is_none()) {
            a = this.next();
            b = other.next();

            if (a.is_none() || b.is_none()) {
                if (a.is_some()) return 1;

                if (b.is_some()) return -1;

                return 0;
            }

            const ord = cmp.call(undefined, a.unwrap(), b.unwrap());

            if (ord !== 0) {
                this.#consumed = true;
                other.#consumed = true;

                return Number.isNaN(ord) ? 0 : (Math.sign(ord) as Ord);
            }
        }

        this.#consumed = true;
        other.#consumed = true;

        return 0;
    }

    collect(): T[] {
        const result = [];

        let item;
        while (!item?.is_none()) {
            item = this.next();

            if (item.is_some()) result.push(item.unwrap());
        }

        this.#consumed = true;

        return result;
    }

    collect_into(collection: T[]): T[] {
        collection.push(...this.collect());

        return collection;
    }

    copied(): Iter<T> {
        return this.cloned();
    }

    count(): number {
        return this.collect().length;
    }

    cycle(): Iter<T> {
        this.#consumed = true;

        return new Iter(
            function* (this: Iter<T>) {
                while (true) {
                    this.#consumed = false;

                    const source = this.cloned();

                    let item;
                    while (!(item = source.#iter.next()).done) yield item.value;

                    this.#consumed = true;
                }
            }.call(this),
        );
    }

    enumerate(): Iter<[number, T]> {
        this.#consumed = true;

        return new Iter(
            function* (this: Iter<T>) {
                let i = 0;

                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    this.#consumed = true;

                    if (item.is_some()) yield [i++, item.unwrap()] as [number, T];
                } while (item.is_some());
            }.call(this),
        );
    }

    eq(other: IterResolvable<T>): boolean;
    eq(@ResolveTo(Iter) other: Iter<T>) {
        return this.eq_by(other, deepEqual);
    }

    eq_by(other: IterResolvable<T>, eq: (self: T, other: T) => boolean): boolean;
    eq_by(@ResolveTo(Iter) other: Iter<T>, eq: (self: T, other: T) => boolean) {
        let a, b;
        while (!a?.is_none() && !b?.is_none()) {
            a = this.next();
            b = other.next();

            if (a.is_none() || b.is_none()) return a.is_none() && b.is_none();

            const same = eq.call(undefined, a.unwrap(), b.unwrap());

            if (!same) return false;
        }

        this.#consumed = true;
        other.#consumed = true;

        if (!a?.is_none() || !b?.is_none()) return false;

        return true;
    }

    filter<U extends T = T>(f: (item: T) => item is U): Iter<U>;
    filter<_>(f: (item: T) => boolean): Iter<T>;
    filter(f: (item: T) => boolean): Iter<T> {
        this.#consumed = true;

        return new Iter(
            function* (this: Iter<T>) {
                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    while (item.is_some() && !f.call(undefined, item.unwrap())) item = this.next();

                    if (item.is_some()) yield item.unwrap();

                    this.#consumed = true;
                } while (item.is_some());
            }.call(this),
        );
    }

    filter_map<U>(f: (item: T) => Option<U>): Iter<U> {
        this.#consumed = true;

        return new Iter(
            function* (this: Iter<T>) {
                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    if (item.is_some()) {
                        const opt = f.call(undefined, item.unwrap());

                        if (opt.is_some()) yield opt.unwrap();
                    }

                    this.#consumed = true;
                } while (item.is_some());
            }.call(this),
        );
    }

    find(f: (item: T) => boolean): Option<T> {
        return this.filter(f).next();
    }

    find_map<U>(f: (item: T) => Option<U>): Option<U> {
        return this.filter_map(f).next();
    }

    flat_map<U>(f: (item: T) => IterResolvable<U>): Iter<U> {
        return this.map(f).flatten();
    }

    flatten(): [T] extends [IterResolvable<infer U>] ? Iter<U> : never;
    flatten() {
        this.#consumed = true;

        return new Iter(
            function* (this: Iter<T>) {
                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    this.#consumed = true;

                    if (item.is_some()) {
                        if (!item.unwrap() || typeof item.unwrap() !== "object")
                            throw new TypeError(`unable to flatten this value`);

                        const source = toIter(item.unwrap());

                        let el;
                        do {
                            el = source.next();

                            if (el.is_some()) yield el.unwrap();
                        } while (el.is_some());
                    }
                } while (item.is_some());
            }.call(this),
        );
    }

    fold<U>(init: U, f: (folded: U, item: T) => U): U {
        this.#consumed = true;

        let item;
        do {
            this.#consumed = false;

            item = this.next();

            this.#consumed = true;

            if (item.is_some()) init = f.call(undefined, init, item.unwrap());
        } while (item.is_some());

        return init;
    }

    for_each(f: (item: T) => void): void {
        this.#consumed = true;

        let item;
        do {
            this.#consumed = false;

            item = this.next();

            this.#consumed = true;

            if (item.is_some()) f.call(undefined, item.unwrap());
        } while (item.is_some());
    }

    fuse(): Iter<T> {
        this.#fused.called = true;

        return this;
    }

    ge(other: IterResolvable<T>): [T] extends [number] ? boolean : never;
    ge(@ResolveTo(Iter) other: Iter<T>) {
        return [0, 1].includes(this.cmp(other));
    }

    gt(other: IterResolvable<T>): [T] extends [number] ? boolean : never;
    gt(@ResolveTo(Iter) other: Iter<T>) {
        return this.cmp(other) === 1;
    }

    inspect(f: (item: T) => void): Iter<T> {
        this.#consumed = true;

        return new Iter<T>(
            function* (this: Iter<T>) {
                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    if (item.is_some()) {
                        f.call(undefined, item.unwrap());

                        yield item.unwrap();
                    }

                    this.#consumed = true;
                } while (item.is_some());
            }.call(this),
        );
    }

    intersperse<U>(separator: U): Iter<T | U> {
        this.#consumed = true;

        let emitted = false;

        return new Iter<T | U>(
            function* (this: Iter<T>) {
                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    this.#consumed = true;

                    if (item.is_some()) {
                        if (emitted) yield structuredClone(separator);
                        yield item.unwrap();
                        emitted = true;
                    }
                } while (item.is_some());
            }.call(this),
        );
    }

    intersperse_with<U>(separator: () => U): Iter<T | U> {
        this.#consumed = true;

        let emitted = false;

        return new Iter<T | U>(
            function* (this: Iter<T>) {
                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    this.#consumed = true;

                    if (item.is_some()) {
                        if (emitted) yield separator.call(undefined);
                        yield item.unwrap();
                        emitted = true;
                    }
                } while (item.is_some());
            }.call(this),
        );
    }

    is_partitioned(predicate: (item: T) => boolean): boolean {
        let partitioned = false;

        let item;
        do {
            item = this.next();

            if (item.is_some()) {
                const result = predicate.call(undefined, item.unwrap());

                if (!result) partitioned = true;

                if (partitioned && result) return false;
            }
        } while (item.is_some());

        this.#consumed = true;

        return true;
    }

    is_sorted(): [T] extends [number] ? boolean : never;
    is_sorted() {
        const collection = this.collect() as number[];

        return collection.every((v, i, a) => (i + 1 in a ? v <= a[i + 1] : true));
    }

    is_sorted_by(compare: (self: T, other: T) => boolean): boolean {
        const collection = this.collect();

        return collection.every((v, i, a) => (i + 1 in a ? compare.call(undefined, v, a[i + 1]) : true));
    }

    is_sorted_by_key(f: (item: T) => number): boolean {
        const collection = this.collect();

        const keys = collection.map(f);

        return collection.every((_, i, a) => (i + 1 in a ? keys[i] <= keys[i + 1] : true));
    }

    last(): Option<T> {
        let last: Option<T> = None;
        let item: Option<T> = None;

        do {
            [last, item] = [item, this.next()];
        } while (item.is_some());

        return last;
    }

    le(other: IterResolvable<T>): [T] extends [number] ? boolean : never;
    le(@ResolveTo(Iter) other: Iter<T>) {
        return [-1, 0].includes(this.cmp(other));
    }

    lt(other: IterResolvable<T>): [T] extends [number] ? boolean : never;
    lt(@ResolveTo(Iter) other: Iter<T>) {
        return this.cmp(other) === -1;
    }

    map<U>(f: (item: T) => U): Iter<U> {
        this.#consumed = true;

        return new Iter<U>(
            function* (this: Iter<T>) {
                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    if (item.is_some()) yield f.call(undefined, item.unwrap());

                    this.#consumed = true;
                } while (item.is_some());
            }.call(this),
        );
    }

    map_while<U>(predicate: (item: T) => Option<U>): Iter<U> {
        this.#consumed = true;

        return new Iter<U>(
            function* (this: Iter<T>) {
                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    if (item.is_some()) {
                        const opt = predicate.call(undefined, item.unwrap());

                        if (opt.is_none()) return;

                        yield opt.unwrap();
                    }

                    this.#consumed = true;
                } while (item.is_some());
            }.call(this),
        );
    }

    max(): [T] extends [number] ? number : never;
    max() {
        const collection = this.collect() as number[];

        return Math.max(...collection);
    }

    max_by(compare: (self: T, other: T) => number): Option<T> {
        const collection = this.collect();

        collection.sort(compare);

        return collection.length ? Some(collection[0]) : None;
    }

    max_by_key(f: (item: T) => number): Option<T> {
        const collection = this.collect();

        const keys = collection.map(f);

        const score = Math.max(...keys);

        const index = keys.length - keys.reverse().findIndex((key) => key === score) - 1;

        return index in collection ? Some(collection[index]) : None;
    }

    min(): [T] extends [number] ? number : never;
    min() {
        const collection = this.collect() as number[];

        return Math.min(...collection);
    }

    min_by(compare: (self: T, other: T) => number): Option<T> {
        const collection = this.collect();

        collection.sort(compare);

        return collection.length ? Some(collection[collection.length - 1]) : None;
    }

    min_by_key(f: (item: T) => number): Option<T> {
        const collection = this.collect();

        const keys = collection.map(f);

        const score = Math.min(...keys);

        const index = keys.length - keys.reverse().findIndex((key) => key === score) - 1;

        return index in collection ? Some(collection[index]) : None;
    }

    ne(other: IterResolvable<T>): boolean;
    ne(@ResolveTo(Iter) other: Iter<T>) {
        return !this.eq(other);
    }

    next_chunk(n: number): Result<T[], Iter<T>> {
        if (n < 0 || !Number.isInteger(n)) throw new TypeError(`n is not a nonnegative integer`);

        const result: T[] = [];

        for (let i = 0; i < n; i++) {
            const item = this.next();

            if (item.is_none()) return Err(toIter(result));

            result.push(item.unwrap());
        }

        return Ok(result);
    }

    nth(n: number): Option<T> {
        if (n < 0 || !Number.isInteger(n)) throw new TypeError(`n is not a nonnegative integer`);

        for (let i = 0; i < n - 1; i++) {
            this.next();
        }

        return this.next();
    }

    partition(f: (item: T) => boolean): [T[], T[]] {
        const result = [[], []] as [T[], T[]];

        let item;
        do {
            item = this.next();

            if (item.is_some()) {
                const bool = f.call(undefined, item.unwrap());

                result[+!bool].push(item.unwrap());
            }
        } while (item.is_some());

        this.#consumed = true;

        return result;
    }

    peek(): Option<T> {
        const peeked = this.#iter.next();

        const source = this.#iter;

        this.#iter = function* (this: Iter<T>) {
            if (peeked.done) return;

            yield peeked.value;

            let item;
            while (!item?.done) yield (item = source.next()).value as T;
        }.call(this);

        return peeked.done ? None : Some(peeked.value);
    }

    position(predicate: (item: T) => boolean): Option<number> {
        let index = 0;

        let item;
        do {
            this.#consumed = false;

            item = this.next();

            this.#consumed = true;

            if (item.is_none()) return None;

            if (predicate.call(undefined, item.unwrap())) return Some(index);

            index++;
        } while (item.is_some());

        return None;
    }

    product(): [T] extends [NumberResolvable] ? number : never;
    product() {
        return this.fold(1, (product, item) => product * toNumber(item));
    }

    reduce(f: (reduced: T, item: T) => T): Option<T> {
        const start = this.next();

        if (start.is_none()) return None;

        let init = start.unwrap();

        let item;
        do {
            this.#consumed = false;

            item = this.next();

            this.#consumed = true;

            if (item.is_some()) init = f.call(undefined, init, item.unwrap());
        } while (item.is_some());

        return Some(init);
    }

    scan<S, U>(initial_state: S, f: (_: { state: S }, item: T) => Option<U>): Iter<U> {
        this.#consumed = true;

        return new Iter<U>(
            function* (this: Iter<T>) {
                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    this.#consumed = true;

                    if (item.is_some()) {
                        const _ = { state: initial_state };

                        const opt = f.call(undefined, _, item.unwrap());

                        if (opt.is_none()) return;

                        yield opt.unwrap();

                        initial_state = _.state;
                    }
                } while (item.is_some());
            }.call(this),
        );
    }

    skip(n: number): Iter<T> {
        if (n < 0 || !Number.isInteger(n)) throw new TypeError(`n is not a nonnegative integer`);

        this.#consumed = true;

        return new Iter(
            function* (this: Iter<T>) {
                this.#consumed = false;

                while (n--) this.next();

                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    this.#consumed = true;

                    if (item.is_some()) yield item.unwrap();
                } while (item.is_some());
            }.call(this),
        );
    }

    skip_while(predicate: (item: T) => boolean): Iter<T> {
        this.#consumed = true;

        return new Iter(
            function* (this: Iter<T>) {
                this.#consumed = false;

                let skipped = this.#iter.next();
                while (!skipped.done && predicate.call(undefined, skipped.value)) skipped = this.#iter.next();

                yield skipped.value as T;

                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    this.#consumed = true;

                    if (item.is_some()) yield item.unwrap();
                } while (item.is_some());
            }.call(this),
        );
    }

    step_by(step: number): Iter<T> {
        if (step <= 0 || !Number.isInteger(step)) throw new TypeError(`n is not a positive integer`);

        this.#consumed = true;

        return new Iter(
            function* (this: Iter<T>) {
                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    if (item.is_none()) return;

                    let n = step;
                    while (--n) this.next();

                    this.#consumed = true;

                    yield item.unwrap();
                } while (item.is_some());
            }.call(this),
        );
    }

    sum(): [T] extends [NumberResolvable] ? number : never;
    sum() {
        return this.fold(0, (product, item) => product + toNumber(item));
    }

    take(n: number): Iter<T> {
        if (n < 0 || !Number.isInteger(n)) throw new TypeError(`n is not a nonnegative integer`);

        this.#consumed = true;

        return new Iter(
            function* (this: Iter<T>) {
                this.#consumed = false;

                let item;
                do {
                    if (!n--) return;

                    this.#consumed = false;

                    item = this.next();

                    this.#consumed = true;

                    if (item.is_some()) yield item.unwrap();
                } while (item.is_some());
            }.call(this),
        );
    }

    take_while(predicate: (item: T) => boolean): Iter<T> {
        this.#consumed = true;

        return new Iter(
            function* (this: Iter<T>) {
                this.#consumed = false;

                let item;
                do {
                    this.#consumed = false;

                    item = this.next();

                    this.#consumed = true;

                    if (item.is_some()) {
                        if (!predicate.call(undefined, item.unwrap())) return;

                        yield item.unwrap();
                    }
                } while (item.is_some());
            }.call(this),
        );
    }

    unzip(): [T] extends [readonly [infer A, infer B]] ? [A[], B[]] : never;
    unzip() {
        const collection = this.collect();

        return collection.reduce<[unknown[], unknown[]]>(
            (tuple, item) => {
                const [a, b] = item as [unknown, unknown];

                return [tuple[0].concat(a), tuple[1].concat(b)];
            },
            [[], []],
        );
    }

    zip<U>(other: IterResolvable<U>): Iter<[T, U]>;
    zip<U>(@ResolveTo(Iter) other: Iter<U>) {
        this.#consumed = true;
        other.#consumed = true;

        return new Iter<[T, U]>({
            next: function (this: Iter<T>) {
                const a = this.#iter.next();
                const b = other.#iter.next();

                if (a.done || b.done) return { value: undefined, done: true as true };

                return { value: [a.value, b.value] as [T, U], done: false as false };
            }.bind(this),
        });
    }
}
