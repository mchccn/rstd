import deepEqual from "deep-equal";
import { option } from "../index.js";

const { Some, None } = option;

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
}

const narrowed = Symbol();

export type Is = { [narrowed]: true };

export const Ok = <T, E = never>(value: T) => new _<T, E>({ value });

export const Err = <E, T = never>(err: E) => new _<T, E>({ err });

export type Result<T, E> = _<T, E>;

export type Ok<T> = _<T, never>;

export type Err<E> = _<never, E>;
