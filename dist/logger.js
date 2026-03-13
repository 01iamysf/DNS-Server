"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
function createLogger() {
    const log = (level, message, fields) => {
        const base = {
            level,
            message,
            time: new Date().toISOString(),
        };
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ ...base, ...(fields || {}) }));
    };
    return {
        info: (message, fields) => log("info", message, fields),
        error: (message, fields) => log("error", message, fields),
    };
}
