export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Wraps an async route handler so unhandled promise rejections
 * are forwarded to Express's error middleware automatically.
 */
export const asyncHandler =
  (fn: Function) =>
  (...args: any[]) => {
    const next = args[args.length - 1]
    return Promise.resolve(fn(...args)).catch(next)
  }