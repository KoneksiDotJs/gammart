import { Router } from 'express'
import { z } from 'zod'
import { productController } from '../controllers/product.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate.middleware'
import { ProductCategory } from '@prisma/client'

const router = Router()

const createProductSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  category: z.nativeEnum(ProductCategory),
  game: z.string().min(1).max(100),
  price: z.number().positive('Price must be positive'),
  imageUrls: z.array(z.string().url()).max(5).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// Public routes
router.get('/', productController.getProducts)
router.get('/:id', productController.getProductById)

// Protected routes (seller only)
router.post(
  '/',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  validate(createProductSchema),
  productController.createProduct
)

router.get('/my/listings', authenticate, productController.getMyProducts)

router.patch(
  '/:id/deactivate',
  authenticate,
  authorize('SELLER', 'ADMIN'),
  productController.deactivateProduct
)

export default router