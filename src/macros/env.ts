export const env: ((key: string) => string | undefined) | undefined = (key: string) => {
    if (typeof process === "undefined") return undefined;

    return process.env[key];
};
