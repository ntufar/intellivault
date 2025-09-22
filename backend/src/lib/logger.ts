import pino from 'pino';
import { randomUUID } from 'crypto';

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Request ID middleware helper
export function generateRequestId(): string {
  return randomUUID();
}

// Create child logger with request ID
export function createRequestLogger(requestId: string): pino.Logger {
  return logger.child({ requestId });
}

// Default export
export { logger };
export default logger;
