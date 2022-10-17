export function unenumerable<T>(target: T, keys: (keyof T)[]) {
    keys.forEach((key) => {
        const desc = Object.getOwnPropertyDescriptor(target, key)!;

        desc.enumerable = false;

        Object.defineProperty(target, key, desc);
    });
}
