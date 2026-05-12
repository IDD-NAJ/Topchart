export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  message: string;
  [key: string]: any;
}

class Logger {
  private log(level: LogLevel, payload: LogPayload | string, error?: unknown) {
    const isProd = process.env.NODE_ENV === "production";
    
    let logData: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level,
    };

    if (typeof payload === "string") {
      logData.message = payload;
    } else {
      logData = { ...logData, ...payload };
    }

    if (error) {
      if (error instanceof Error) {
        logData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        logData.error = String(error);
      }
    }

    if (isProd) {
      // Structured JSON logging in production
      console.log(JSON.stringify(logData));
    } else {
      // Pretty printing in development
      const prefix = `[${level.toUpperCase()}] ${logData.timestamp}:`;
      const msg = logData.message;
      const extras = { ...logData };
      delete extras.timestamp;
      delete extras.level;
      delete extras.message;
      
      switch (level) {
        case "debug": console.debug(prefix, msg, Object.keys(extras).length ? extras : ""); break;
        case "info": console.info(prefix, msg, Object.keys(extras).length ? extras : ""); break;
        case "warn": console.warn(prefix, msg, Object.keys(extras).length ? extras : ""); break;
        case "error": console.error(prefix, msg, Object.keys(extras).length ? extras : ""); break;
      }
    }
  }

  debug(payload: LogPayload | string) { this.log("debug", payload); }
  info(payload: LogPayload | string) { this.log("info", payload); }
  warn(payload: LogPayload | string, error?: unknown) { this.log("warn", payload, error); }
  error(payload: LogPayload | string, error?: unknown) { this.log("error", payload, error); }
}

export const logger = new Logger();
