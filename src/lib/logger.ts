/**
 * Structured Logger & Error Tracker for Ibrahim Tours Zanzibar
 * Captures operational events, audit data, and dispatches critical exceptions to Sentry.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  message: string;
  level?: LogLevel;
  context?: Record<string, unknown>;
  error?: Error | unknown;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      ...(context ? { context } : {}),
    };
  }

  info(message: string, context?: Record<string, unknown>) {
    const formatted = this.formatMessage('info', message, context);
    if (this.isProduction) {
      console.log(JSON.stringify(formatted));
    } else {
      console.log(`[INFO] ${formatted.timestamp} - ${message}`, context || '');
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    const formatted = this.formatMessage('warn', message, context);
    if (this.isProduction) {
      console.warn(JSON.stringify(formatted));
    } else {
      console.warn(`[WARN] ${formatted.timestamp} - ${message}`, context || '');
    }
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    const errorDetails =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;

    const formatted = {
      ...this.formatMessage('error', message, context),
      error: errorDetails,
    };

    if (this.isProduction) {
      console.error(JSON.stringify(formatted));
    } else {
      console.error(`[ERROR] ${formatted.timestamp} - ${message}`, error || '', context || '');
    }

    // Forward to Sentry if initialized
    try {
      if (typeof window !== 'undefined') {
        const Sentry = (window as unknown as { Sentry?: { captureException: (err: unknown) => void } }).Sentry;
        if (Sentry?.captureException && error) {
          Sentry.captureException(error);
        }
      } else if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
        import('@sentry/nextjs')
          .then((Sentry) => {
            if (error) {
              Sentry.captureException(error, {
                extra: context,
              });
            } else {
              Sentry.captureMessage(message, 'error');
            }
          })
          .catch(() => {
            // Sentry not available or failed to load
          });
      }
    } catch {
      // Avoid recursive logger crashes
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, context || '');
    }
  }
}

export const logger = new Logger();
