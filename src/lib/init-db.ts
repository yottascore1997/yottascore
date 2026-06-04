import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    // Create admin user if not exists
    const adminEmail = 'admin@example.com'
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Admin User',
          hashedPassword: hashedPassword,
          phoneNumber: '1234567890',
          role: 'ADMIN',
        },
      })
}

} catch (error) {
throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
process.exit(1)
  }) 