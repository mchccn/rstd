const comments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const args = /([^\s,]+)/g;

export function getParamNames(fn: Function) {
    const s = fn.toString().replace(comments, "");

    return Array.from(s.slice(s.indexOf("(") + 1, s.indexOf(")")).match(args) ?? []);
}
