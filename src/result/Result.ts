import deepEqual from "deep-equal";
import { None, Option, Some } from "../option/Option.js";
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

    cloned() {
        return "err" in this.#result ? Err(structuredClone(this.#result.err)) : Ok(structuredClone(this.#result.value));
    }

    contains<T>(x: T) {
        return "value" in this.#result && deepEqual(x, this.#result.value, { strict: true });
    }

    contains_err<E>(f: E) {
        return "err" in this.#result && deepEqual(f, this.#result.err, { strict: true });
    }

    copied() {
        return this.cloned();
    }

    err() {
        return "err" in this.#result ? Some(this.#result.err) : None;
    }

    expect(msg: string) {
        if ("err" in this.#result) throw new Error(msg);

        return this.#result.value;
    }

    expect_err(msg: string) {
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

    is_ok(): this is Ok<T> {
        return "value" in this.#result;
    }

    transpose(): T extends Option<infer U> ? (U extends U ? Option<Result<U, E>> : never) : never;
    transpose() {
        if ("err" in this.#result) return Some(Err(this.#result.err));

        return (this.#result.value as Option<any>).is_none()
            ? (None as Option<Result<unknown, E>>)
            : Some(Ok((this.#result.value as Option<any>).unwrap()));
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
