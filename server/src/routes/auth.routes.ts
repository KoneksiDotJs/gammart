import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate.middleware'
import {
  registerSchema, loginSchema,
  updateProfileSchema, updatePasswordSchema,
} from './auth.schema'

const router = Router()

router.post('/register', validate(registerSchema), authController.register)
router.post('/login',    validate(loginSchema),    authController.login)
router.get('/me',        authenticate,             authController.getMe)
router.patch('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile)
router.patch('/password', authenticate, validate(updatePasswordSchema), authController.updatePassword)

export default router