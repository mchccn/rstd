import deepEqual from "deep-equal";
import { toIter } from "../iter/helpers/toIter.js";
import type { Iter } from "../iter/Iter.js";
import { Ok, Result } from "../result/Result.js";
import { Namespaced } from "../utils/namespaced.js";
import { unenumerable } from "../utils/unenumerable.js";

@Namespaced("Option<T>", { errors: true })
class _<T> {
    #none;
    #value;

    constructor(...args: [] | [value: T]) {
        if (args.length === 0) {
            this.#none = true;
            this.#value = undefined as never;
        } else {
            this.#none = false;
            this.#value = args[0];
        }

        unenumerable(this as _<T>, ["is_some_and", "unwrap_or", "unwrap_or_else"]);
    }

    and<U>(optb: Option<U>): Option<U> {
        if (this.#none) return None;

        return optb;
    }

    and_then<U>(f: (value: T) => Option<U>): Option<U> {
        if (this.#none) return None;

        return f.call(undefined, this.#value);
    }

    cloned(): Option<T> {
        return this.#none ? new _() : new _(structuredClone(this.#value));
    }

    copied(): Option<T> {
        return this.cloned();
    }

    contains(value: T): boolean {
        return this.#none ? false : deepEqual(this.#value, value, { strict: true });
    }

    expect(msg: string): T {
        if (this.#none) throw new Error(msg);

        return this.#value;
    }

    filter<U extends T = T>(predicate: (value: T) => value is U): Option<U>;
    filter<_>(predicate: (value: T) => boolean): Option<T>;
    filter(predicate: (value: T) => boolean): Option<T> {
        if (this.#none) return None;

        return predicate.call(undefined, this.#value) ? new _(this.#value) : None;
    }

    flatten(): T extends Option<infer U> ? Option<U> : never;
    flatten() {
        if (this.#none) return None;

        if (this.#value instanceof _) return new _(this.#value.#value);

        throw new TypeError(`cannot flatten a value that is not an option`);
    }

    get_or_insert(value: T): T {
        if (this.#none) {
            this.#none = false;
            this.#value = value;
        }

        return this.#value;
    }

    get_or_insert_with(f: () => T): T {
        return this.get_or_insert(f.call(undefined));
    }

    insert(value: T): T {
        this.#none = false;
        this.#value = value;

        return this.#value;
    }

    inspect(f: (value: T) => void): Option<T> {
        if (!this.#none) f.call(undefined, this.#value);

        return this;
    }

    is_none(): this is Is & None {
        return this.#none;
    }

    is_some(): this is [T] extends [never] ? never : Is & Some<T> {
        return !this.#none;
    }

    is_some_and: [T] extends [never] ? (f: (item: never) => boolean) => false : is_some_and<T> = function is_some_and(
        this: _<T>,
        f: (item: T) => boolean,
    ) {
        if (this.#none) return false;

        return f.call(undefined, this.#value);
    } as _<T>["is_some_and"];

    iter(): Iter<T> {
        return this.#none ? toIter<T>([]) : toIter([this.#value]);
    }

    map<U>(f: (value: T) => U): Option<U> {
        if (this.#none) return None;

        return new _(f.call(undefined, this.#value));
    }

    map_or<U>(fallback: U, f: (value: T) => U): U {
        if (this.#none) return fallback;

        return f.call(undefined, this.#value);
    }

    map_or_else<U>(fallback: () => U, f: (value: T) => U): U {
        if (this.#none) return fallback.call(undefined);

        return f.call(undefined, this.#value);
    }

    ok_or<E>(err: E) {}

    ok_or_else<E>(err: () => E) {}

    or(optb: Option<T>): Option<T> {
        if (!this.#none) return new _(this.#value);

        return optb.#none ? None : new _(optb.#value);
    }

    or_else(f: () => Option<T>): Option<T> {
        if (!this.#none) return new _(this.#value);

        return f.call(undefined);
    }

    replace(value: T): Option<T> {
        const none = this.#none;
        const original = this.#value;

        this.#none = false;
        this.#value = value;

        return none ? None : new _(original);
    }

    take(): Option<T> {
        const none = this.#none;
        const original = this.#value;

        this.#none = true;
        this.#value = undefined as never;

        return none ? None : new _(original);
    }

    transpose(): T extends Result<infer O, infer E> ? Result<Option<O>, E> : never;
    transpose() {
        if (this.#none) return Ok(None);

        return this.#value as Result<any, any>;
    }

    unwrap(): T {
        if (this.#none) throw new Error(`called on a \`None\` value`);

        return this.#value;
    }

    unwrap_or: [T] extends [never] ? (fallback: unknown) => never : (fallback: T) => T = function unwrap_or(
        this: _<T>,
        fallback: T,
    ): T {
        if (this.#none) return fallback;

        return this.#value;
    } as _<T>["unwrap_or"];

    unwrap_or_else: [T] extends [never] ? (fallback: () => unknown) => never : (fallback: () => T) => T =
        function unwrap_or_else(this: _<T>, fallback: () => T) {
            if (this.#none) return fallback.call(undefined);

            return this.#value;
        } as _<T>["unwrap_or_else"];

    unwrap_unchecked(): T {
        return this.#value;
    }

    unzip(): [T] extends [[infer A, infer B]] ? [Some<A>, Some<B>] | [None, None] : never;
    unzip() {
        if (this.#none) return [None, None];

        const [a, b] = this.#value as [any, any];

        return [new _(a), new _(b)];
    }

    xor(optb: Option<T>): Option<T> {
        if (this.#none && !optb.#none) return new _(optb.#value);
        if (!this.#none && optb.#none) return new _(this.#value);

        return None;
    }

    zip<U>(other: Option<U>): Option<[T, U]> {
        if (!this.#none && !other.#none) return new _([this.#value, other.#value]);

        return None;
    }

    zip_with<U, R>(other: Option<U>, f: (self: T, other: U) => R): Option<R> {
        if (!this.#none && !other.#none) return new _(f.call(undefined, this.#value, other.#value));

        return None;
    }

    static {
        Reflect.deleteProperty(this, "name");

        Object.defineProperty(this, "name", {
            value: "Option",
            writable: false,
            enumerable: false,
            configurable: true,
        });
    }
}

export interface is_some_and<T> {
    <U extends T = T>(f: (item: T) => item is U): this is Is & Some<U>;
    <_>(f: (item: T) => boolean): this is Is & Some<T>;
}

const narrowed = Symbol();

export type Is = { [narrowed]: true };

export const None = new _<never>();

export const Some = <T>(value: T) => new _(value);

export type None = _<never>;

export type Some<T> = _<T>;

export type Option<T> = None | Some<T>;
