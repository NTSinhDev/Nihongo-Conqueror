import { ILogger, IClock, IIdGenerator } from "../application/ports";

export class ConsoleLogger implements ILogger {
  info(message: string, context?: any): void {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : "");
  }

  warn(message: string, context?: any): void {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : "");
  }

  error(message: string, error?: any, context?: any): void {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error || "", context ? JSON.stringify(context) : "");
  }

  debug(message: string, context?: any): void {
    console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : "");
  }
}

export class SystemClock implements IClock {
  now(): string {
    return new Date().toISOString();
  }
}

export class UuidGenerator implements IIdGenerator {
  generateId(): string {
    // Attempt standard crypto in Node.js or browser
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Fallback standard Node.js crypto module or simple random generator
    try {
      // Lazy load standard Node.js crypto
      const crypto = require("crypto");
      if (crypto && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch {
      // Ignore requiring error (e.g. in client-side bundling)
    }

    // Secure fallback random generator
    return "id-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now().toString(36);
  }
}
