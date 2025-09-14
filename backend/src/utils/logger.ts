class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  log(...args: any[]) {
    if (!this.isProduction) {
      console.log(...args);
    }
  }

  error(...args: any[]) {
    console.error(...args); // שגיאות תמיד נרשמות
  }

  warn(...args: any[]) {
    if (!this.isProduction) {
      console.warn(...args);
    }
  }
}

export const logger = new Logger();
