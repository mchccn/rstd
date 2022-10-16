import "reflect-metadata";
import { toIter } from "../helpers/toIter.js";
import { toNumber } from "../helpers/toNumber.js";
import { Iter } from "../Iter.js";

const IterResolvableKey = "IteratorResolvable";
const NumberResolvableKey = "NumberResolvable";

export function ResolveTo(supported: typeof Iter | NumberConstructor): ParameterDecorator {
    const key = new Map<new (...args: any[]) => any, string>([
        [Iter, IterResolvableKey],
        [Number, NumberResolvableKey],
    ]).get(supported)!;

    return (target, property, index) => {
        Reflect.defineMetadata(
            key,
            (Reflect.getOwnMetadata(key, target, property) ?? []).concat(index),
            target,
            property,
        );
    };
}

export function UseResolvables(): ClassDecorator {
    const convert = new Map<string, (source: unknown) => unknown>([
        [IterResolvableKey, toIter],
        [NumberResolvableKey, toNumber],
    ]);

    return (target) => {
        const methods = Object.getOwnPropertyNames(target.prototype).filter(
            (k) => k !== "constructor" && typeof target.prototype[k] === "function",
        );

        for (const key of methods) {
            const descriptor = Object.getOwnPropertyDescriptor(target.prototype, key)!;

            const original = descriptor.value as Function;

            Object.defineProperty(target.prototype, key, {
                ...descriptor,
                value: function (this: any, ...args: any[]) {
                    for (const meta of Reflect.getOwnMetadataKeys(target.prototype, key)) {
                        const indices = Reflect.getOwnMetadata(meta, target.prototype, key);

                        if (Array.isArray(indices))
                            for (const index of indices) {
                                args[index] = convert.get(meta)?.(args[index]) ?? args[index];
                            }
                    }

                    return original.apply(this, args);
                },
            });
        }

        return target;
    };
}
