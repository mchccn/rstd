export function cloned<T>(source: Iterator<T, unknown, undefined>) {
    const buffers = [[], []] as T[][];
    const done = Symbol();

    const next = (i: number) => {
        if (buffers[i].length !== 0) return buffers[i].shift()!;

        const x = source.next();

        if (x.done) return done;

        buffers[1 - i].push(x.value);

        return x.value;
    };

    return [next, done] as [(i: 0 | 1) => T, symbol];
}
