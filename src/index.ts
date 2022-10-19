import * as __iter__ from "./iter/index.js";
import * as __macros__ from "./macros/index.js";
import * as __option__ from "./option/index.js";
import * as __result__ from "./result/index.js";

// MUST TEST ALL RESULT METHODS

const { Ok, Err } = __result__;

const a = __result__.Ok(42) as __result__.Result<number, string>;
const b = __result__.Err("") as __result__.Result<number, string>;

console.log(a.and(b));

console.log(Ok(42).and("b"));

export { __iter__ as iter };
export { __option__ as option };
export { __result__ as result };
export { __macros__ as macros };
