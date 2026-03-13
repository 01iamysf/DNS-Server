type LogLevel = "info" | "error";

interface LogFields {
  [key: string]: unknown;
}

export function createLogger() {
  const log = (level: LogLevel, message: string, fields?: LogFields) => {
    const base = {
      level,
      message,
      time: new Date().toISOString(),
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ...base, ...(fields || {}) }));
  };

  return {
    info: (message: string, fields?: LogFields) => log("info", message, fields),
    error: (message: string, fields?: LogFields) =>
      log("error", message, fields),
  };
}

