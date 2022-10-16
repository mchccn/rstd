import { getParamNames } from "./getParamNames.js";

type ClassMethodDecorator = (...args: Parameters<MethodDecorator>) => ReturnType<MethodDecorator>;

function isAll(value: any): value is "*" | "all" | true {
    return ["*", "all", true].includes(value);
}

const nsmap = new Map<Function, string>();

export function Namespaced(
    name: string,
    opts?: {
        errors?: string[] | "*" | "all" | true;
    },
): ClassDecorator {
    if (opts?.errors) {
        return (target) => {
            nsmap.set(target, name);

            const methods = isAll(opts.errors)
                ? Object.getOwnPropertyNames(target.prototype).filter(
                      (k) => k !== "constructor" && typeof target.prototype[k] === "function",
                  )
                : opts.errors!;

            for (const key of methods) {
                Object.defineProperty(
                    target.prototype,
                    key,
                    NamespacedErrors()(target.prototype, key, Object.getOwnPropertyDescriptor(target.prototype, key)!)!,
                );
            }
        };
    }

    return (target) => {
        nsmap.set(target, name);
    };
}

export function NamespacedErrors(): ClassMethodDecorator {
    return (target, key, descriptor) => {
        const original = descriptor.value;

        if (typeof original !== "function") throw new TypeError();

        descriptor.value = function (this: typeof target, ...args: any[]) {
            try {
                return original.apply(this, args);
            } catch (error) {
                if (error instanceof Error) {
                    error.message = `${nsmap.get(target.constructor)}::${String(key)}(${getParamNames(original).join(
                        ", ",
                    )}) ~ ${error.message}`;

                    throw error;
                } else throw error;
            }
        };

        return descriptor;
    };
}
