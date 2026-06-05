import { PrismaClient, Role, ProductCategory, ProductStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Users ────────────────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const sellerPassword = await bcrypt.hash('Seller123!', 12)
  const buyerPassword = await bcrypt.hash('Buyer123!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gamemarket.id' },
    update: {},
    create: {
      email: 'admin@gamemarket.id',
      username: 'admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      displayName: 'Admin',
      isVerified: true,
    },
  })

  const seller = await prisma.user.upsert({
    where: { email: 'seller@gamemarket.id' },
    update: {},
    create: {
      email: 'seller@gamemarket.id',
      username: 'pro_seller',
      passwordHash: sellerPassword,
      role: Role.SELLER,
      displayName: 'Pro Seller',
      bio: 'Trusted seller with 500+ transactions.',
      isVerified: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'buyer@gamemarket.id' },
    update: {},
    create: {
      email: 'buyer@gamemarket.id',
      username: 'test_buyer',
      passwordHash: buyerPassword,
      role: Role.BUYER,
      displayName: 'Test Buyer',
      isVerified: true,
    },
  })

  // ─── Products ─────────────────────────────────────────────────────────────

  const products = [
    {
      sellerId: seller.id,
      title: 'Mobile Legends Account - Mythic Glory Rank | 50+ Skins',
      description:
        'High-ranked Mobile Legends account with Mythic Glory rank (top 1000). Includes 50+ skins, multiple epic skins, and a legendary skin. Account is safe, no banned history. Comes with original email.',
      category: ProductCategory.GAME_ACCOUNT,
      game: 'Mobile Legends',
      price: 850000,
      status: ProductStatus.ACTIVE,
      imageUrls: [],
      metadata: { rank: 'Mythic Glory', skinCount: 52, server: 'ID' },
    },
    {
      sellerId: seller.id,
      title: 'Free Fire Diamond Top Up 1000 Diamonds',
      description:
        'Fast and safe Free Fire diamond top up. Send me your Player ID and we will top up within 15 minutes. Available 24/7. 100% safe, no hack or cheat.',
      category: ProductCategory.TOP_UP,
      game: 'Free Fire',
      price: 120000,
      status: ProductStatus.ACTIVE,
      imageUrls: [],
      metadata: { diamonds: 1000, deliveryTime: '15 minutes' },
    },
    {
      sellerId: seller.id,
      title: 'PUBG Mobile UC Top Up 600 UC',
      description:
        'Top up 600 UC for your PUBG Mobile account. Need your Character ID. Delivery within 30 minutes guaranteed.',
      category: ProductCategory.TOP_UP,
      game: 'PUBG Mobile',
      price: 95000,
      status: ProductStatus.ACTIVE,
      imageUrls: [],
      metadata: { uc: 600, deliveryTime: '30 minutes' },
    },
    {
      sellerId: seller.id,
      title: 'Genshin Impact AR 55 Account | Raiden Shogun + Hu Tao',
      description:
        'Adventure Rank 55 Genshin Impact account. Features Raiden Shogun and Hu Tao both at C0 with their signature weapons. All Mondstadt and Liyue story completed.',
      category: ProductCategory.GAME_ACCOUNT,
      game: 'Genshin Impact',
      price: 1200000,
      status: ProductStatus.ACTIVE,
      imageUrls: [],
      metadata: { ar: 55, server: 'Asia', characters: ['Raiden Shogun', 'Hu Tao'] },
    },
    {
      sellerId: seller.id,
      title: 'Mobile Legends Boosting - Grandmaster to Epic (5 Stars)',
      description:
        'Professional boosting service. We will boost your account from Grandmaster to Epic rank guaranteed. Uses top global heroes. Safe VPN used. ETA 3-5 days.',
      category: ProductCategory.BOOSTING,
      game: 'Mobile Legends',
      price: 180000,
      status: ProductStatus.ACTIVE,
      imageUrls: [],
      metadata: { fromRank: 'Grandmaster', toRank: 'Epic', eta: '3-5 days' },
    },
    {
      sellerId: seller.id,
      title: 'Valorant Points Top Up 1000 VP',
      description:
        'Top up 1000 Valorant Points. Send your Riot ID. Delivery within 1 hour. Works for all SEA servers.',
      category: ProductCategory.TOP_UP,
      game: 'Valorant',
      price: 145000,
      status: ProductStatus.ACTIVE,
      imageUrls: [],
      metadata: { vp: 1000, servers: ['SEA'] },
    },
  ]

  for (const product of products) {
    await prisma.product.create({ data: product })
  }

  console.log('✅ Seed complete!')
  console.log('\nTest accounts:')
  console.log('  Admin  : admin@gamemarket.id / Admin123!')
  console.log('  Seller : seller@gamemarket.id / Seller123!')
  console.log('  Buyer  : buyer@gamemarket.id / Buyer123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })