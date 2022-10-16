import {
    empty,
    from_fn,
    from_generator,
    iter,
    once,
    once_with,
    repeat,
    repeat_with,
    successors,
    zip,
} from "./iter/index.js";

const __iter__ = Object.assign(iter, {
    empty,
    from_fn,
    from_generator,
    once,
    once_with,
    repeat,
    repeat_with,
    successors,
    zip,
});

export { __iter__ as iter };
