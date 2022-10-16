const narrowed = Symbol();

class _<T = never> {
    #none = false;
    #value: T;

    constructor(...args: [] | [value: T]) {
        if (args.length === 0) {
            this.#none = true;
            this.#value = undefined as never;
        } else {
            this.#value = args[0];
        }
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

    copied() {
        return this.cloned();
    }

    contains(value: T) {}

    expect(msg: string) {
        if (this.#none) throw new Error(msg);

        return this.#value;
    }

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

    get_or_insert(value: T) {
        if (this.#none) {
            this.#none = false;
            this.#value = value;
        }

        return this.#value;
    }

    get_or_insert_with(f: () => T) {
        return this.get_or_insert(f.call(undefined));
    }

    insert(value: T) {
        this.#none = false;
        this.#value = value;

        return this.#value;
    }

    inspect(f: (value: T) => void) {
        if (!this.#none) f.call(undefined, this.#value);

        return this;
    }

    is_none(): this is Is & None {
        return this.#none;
    }

    is_some(): this is [T] extends [never] ? never : Is & Some<T> {
        return !this.#none;
    }

    is_some_and: [T] extends [never] ? (f: (item: never) => boolean) => false : IsSomeAnd<T> = function is_some_and(
        this: _<T>,
        f: (item: T) => boolean,
    ) {
        if (this.#none) return false;

        return f.call(undefined, this.#value);
    } as _<T>["is_some_and"];
}

interface IsSomeAnd<T> {
    <U extends T = T>(f: (item: T) => item is U): this is Is & Some<U>;
    <_>(f: (item: T) => boolean): this is Is & Some<T>;
}

type Is = { [narrowed]: true };

export const None = new _();

export const Some = <T>(value: T) => new _(value);

export type None = _;

export type Some<T> = _<T>;

export type Option<T> = None | Some<T>;
