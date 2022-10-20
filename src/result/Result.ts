import deepEqual from "deep-equal";
import { toIter } from "../iter/helpers/toIter.js";
import type { Iter } from "../iter/Iter.js";
import { None, Option, Some } from "../option/Option.js";
import type { Equal } from "../types.js";
import { Namespaced } from "../utils/namespaced.js";

@Namespaced("Result<T, E>", { errors: true })
class _<T, E> {
    #result;

    constructor(args: { value: T } | { err: E }) {
        this.#result = args;
    }

    and<U, W>(
        res: Result<U, [E] extends [never] ? W : E>,
    ): Result<[U] extends [never] ? T : U, [E] extends [never] ? W : E> {
        return ("err" in this.#result ? Err(this.#result.err) : res) as any;
    }

    and_then<U, W>(
        op: () => Result<U, [E] extends [never] ? W : E>,
    ): Result<[U] extends [never] ? T : U, [E] extends [never] ? W : E> {
        return ("err" in this.#result ? Err(this.#result.err) : op.call(undefined)) as any;
    }

    cloned(): Result<T, E> {
        return "err" in this.#result ? Err(structuredClone(this.#result.err)) : Ok(structuredClone(this.#result.value));
    }

    contains(x: T): boolean {
        return "value" in this.#result && deepEqual(x, this.#result.value, { strict: true });
    }

    contains_err(f: E): boolean {
        return "err" in this.#result && deepEqual(f, this.#result.err, { strict: true });
    }

    copied(): Result<T, E> {
        return this.cloned();
    }

    err(): Option<E> {
        return "err" in this.#result ? Some(this.#result.err) : None;
    }

    expect(msg: string): T {
        if ("err" in this.#result) throw new Error(msg);

        return this.#result.value;
    }

    expect_err(msg: string): E {
        if ("value" in this.#result) throw new Error(msg);

        return this.#result.err;
    }

    flatten(): T extends Result<infer U, E> ? Result<U, E> : never;
    flatten() {
        if ("err" in this.#result) return Err(this.#result.err);

        const value = this.#result.value as Result<unknown, E>;

        return ("err" in value.#result ? Err(value.#result.err) : Ok(value.#result.value)) as Result<unknown, E>;
    }

    inspect(f: (value: T) => void): Result<T, E> {
        if ("value" in this.#result) f.call(undefined, this.#result.value);

        return this;
    }

    inspect_err(f: (err: E) => void): Result<T, E> {
        if ("err" in this.#result) f.call(undefined, this.#result.err);

        return this;
    }

    into_err(): Err<E> {
        if ("err" in this.#result) return Err(this.#result.err);

        throw new Error(`called on an \`Ok\` value`);
    }

    into_ok(): Ok<T> {
        if ("err" in this.#result) throw new Error(`called on an \`Err\` value`);

        return Ok(this.#result.value);
    }

    into_ok_or_err(): Equal<T, E> extends true ? T : never;
    into_ok_or_err() {
        return "err" in this.#result ? this.#result.err : this.#result.value;
    }

    is_err(): this is Err<E> {
        return "err" in this.#result;
    }

    is_err_and<U extends E = E>(f: (err: E) => err is U): this is Err<U>;
    is_err_and(f: (err: E) => boolean): this is Err<E>;
    is_err_and(f: (err: E) => boolean): this is Err<E> {
        return "err" in this.#result && f.call(undefined, this.#result.err);
    }

    is_ok(): this is Ok<T> {
        return "value" in this.#result;
    }

    is_ok_and<U extends T = T>(f: (value: T) => value is U): this is Ok<U>;
    is_ok_and(f: (value: T) => boolean): this is Ok<E>;
    is_ok_and(f: (value: T) => boolean): this is Ok<E> {
        return "value" in this.#result && f.call(undefined, this.#result.value);
    }

    iter(): Iter<T> {
        return "err" in this.#result ? toIter<T>([]) : toIter([this.#result.value]);
    }

    // needs testing:

    map<U>(op: (value: T) => U): Result<U, E> {
        if ("err" in this.#result) return Err(this.#result.err);

        return Ok(op.call(undefined, this.#result.value));
    }

    map_err<U>(op: (err: E) => U): Result<T, U> {
        if ("err" in this.#result) return Err(op.call(undefined, this.#result.err));

        return Ok(this.#result.value);
    }

    map_or<U>(fallback: U, f: (value: T) => U): U {
        if ("err" in this.#result) return fallback;

        return f.call(undefined, this.#result.value);
    }

    map_or_else<U>(fallback: (err: E) => U, f: (value: T) => U): U {
        if ("err" in this.#result) return fallback.call(undefined, this.#result.err);

        return f.call(undefined, this.#result.value);
    }

    ok(): Option<T> {
        return "err" in this.#result ? None : Some(this.#result.value);
    }

    or<U>(res: Result<T, U>): Result<T, U> {
        if ("err" in this.#result) return res;

        return Ok(this.#result.value);
    }

    or_else<U>(op: (err: E) => Result<T, U>): Result<T, U> {
        if ("err" in this.#result) return op.call(undefined, this.#result.err);

        return Ok(this.#result.value);
    }

    transpose(): T extends Option<infer U> ? (U extends U ? Option<Result<U, E>> : never) : never;
    transpose() {
        if ("err" in this.#result) return Some(Err(this.#result.err));

        return (this.#result.value as Option<any>).is_none()
            ? (None as Option<Result<unknown, E>>)
            : Some(Ok((this.#result.value as Option<any>).unwrap()));
    }

    unwrap(): T {
        if ("err" in this.#result) throw new Error(`called on an \`Err\` value`);

        return this.#result.value;
    }

    unwrap_err(): E {
        if ("err" in this.#result) return this.#result.err;

        throw new Error(`called on an \`Ok\` value`);
    }

    unwrap_err_unchecked(): E {
        return (this.#result as any).err;
    }

    unwrap_or(fallback: T): T {
        if ("err" in this.#result) return fallback;

        return this.#result.value;
    }

    unwrap_or_else(fallback: (err: E) => T): T {
        if ("err" in this.#result) return fallback.call(undefined, this.#result.err);

        return this.#result.value;
    }

    unwrap_unchecked(): T {
        return (this.#result as any).value;
    }

    static {
        Reflect.deleteProperty(this, "name");

        Object.defineProperty(this, "name", {
            value: "Result",
            writable: false,
            enumerable: false,
            configurable: true,
        });
    }
}

const narrowed = Symbol();

export type Is = { [narrowed]: true };

export const Ok = <T, E = never>(value: T) => new _<T, E>({ value });

export const Err = <E, T = never>(err: E) => new _<T, E>({ err });

export type Result<T, E> = _<T, E>;

export type Ok<T> = _<T, never>;

export type Err<E> = _<never, E>;
