import { Request, Response } from 'express'
import { productService } from '../services/product.service'
import { asyncHandler } from '../utils/appError'
import { AuthenticatedRequest } from '../types'
import { ProductCategory } from '@prisma/client'

export const productController = {
  getProducts: asyncHandler(async (req: Request, res: Response) => {
    const { category, game, search, page, limit } = req.query

    const result = await productService.getProducts({
      category: category as ProductCategory | undefined,
      game: game as string | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    })

    res.json({ success: true, ...result })
  }),

  getProductById: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getProductById(req.params.id)
    res.json({ success: true, data: product })
  }),

  createProduct: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await productService.createProduct(req.user!.id, req.body)
    res.status(201).json({ success: true, data: product })
  }),

  getMyProducts: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const products = await productService.getSellerProducts(req.user!.id)
    res.json({ success: true, data: products })
  }),

  deactivateProduct: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await productService.deactivateProduct(req.params.id, req.user!.id)
    res.json({ success: true, message: 'Product deactivated' })
  }),
}