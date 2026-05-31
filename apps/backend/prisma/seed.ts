import bcrypt from "bcryptjs";
import { PrismaClient, RoleName } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name },
      create: { name },
      update: {}
    });
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { name: "super_admin" } });
  await prisma.user.upsert({
    where: { username: "admin" },
    create: {
      username: "admin",
      passwordHash: await bcrypt.hash("ChangeMe123!", 12),
      roleId: role.id,
      preference: { create: {} }
    },
    update: {}
  });

  await prisma.pool.upsert({
    where: { name: "Fresh Accounts" },
    create: { name: "Fresh Accounts", description: "Default inventory pool" },
    update: {}
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
