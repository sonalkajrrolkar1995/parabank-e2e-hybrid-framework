export class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private timestamp(): string {
    return new Date().toISOString();
  }

  info(message: string): void {
    console.log(`[${this.timestamp()}] [INFO]  ${message}`);
  }

  warn(message: string): void {
    console.warn(`[${this.timestamp()}] [WARN]  ${message}`);
  }

  error(message: string, error?: unknown): void {
    const errMsg = error instanceof Error ? error.message : String(error ?? '');
    console.error(`[${this.timestamp()}] [ERROR] ${message}${errMsg ? ` - ${errMsg}` : ''}`);
  }

  debug(message: string): void {
    if (process.env.DEBUG === 'true') {
      console.debug(`[${this.timestamp()}] [DEBUG] ${message}`);
    }
  }

  step(stepText: string): void {
    console.log(`\n[${this.timestamp()}] [STEP]  ▶ ${stepText}`);
  }
}
