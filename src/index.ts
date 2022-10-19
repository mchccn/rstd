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
import * as __option__ from "./option/index.js";
import * as __result__ from "./result/index.js";

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

// MUST TEST ALL RESULT METHODS

export { __iter__ as iter };
export { __option__ as option };
export { __result__ as result };
