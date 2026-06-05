import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

/**
 * Factory that returns a middleware validating req.body against a Zod schema.
 * On failure, throws a ZodError which the error handler catches.
 *
 * Usage: router.post('/register', validate(registerSchema), authController.register)
 */
export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    schema.parse(req.body) // throws ZodError on failure
    next()
  }