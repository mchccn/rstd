import * as __iter__ from "./iter/index.js";
import * as __macros__ from "./macros/index.js";
import * as __option__ from "./option/index.js";
import * as __result__ from "./result/index.js";

// MUST TEST ALL RESULT METHODS

const { Ok, Err } = __result__;

const a = __result__.Ok(42) as __result__.Result<number, string>;
const b = __result__.Err("err") as __result__.Result<number, string | number>;

//TODO: narrowing with is_ok_and, is_err_and, is_some_and doesn't work
const x = __option__.Some(42) as __option__.Option<string | number>;
if (x.is_some_and((x): x is string => typeof x === "string")) {
    const y = x.unwrap(); // string | number instead of string
}

export { __iter__ as iter };
export { __option__ as option };
export { __result__ as result };
export { __macros__ as macros };
