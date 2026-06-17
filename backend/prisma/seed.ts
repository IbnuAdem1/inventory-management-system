// prisma/seed.ts
// Creates initial database records for development and first-run setup.
// Safe to re-run — uses upsert so it won't create duplicates.
//
// Run with: npm run db:seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─────────────────────────────────────────────
  // OWNER USER
  // ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@autopartspro.com" },
    update: {},
    create: {
      email: "owner@autopartspro.com",
      passwordHash,
      name: "Owner",
      role: "OWNER",
      isActive: true,
    },
  });

  console.log(`✅ Owner account: ${owner.email}`);

  // ─────────────────────────────────────────────
  // DEMO INVENTORY ITEMS
  // Same 8 items from the frontend mockData.ts
  // Useful for testing the UI immediately after setup
  // ─────────────────────────────────────────────
  const demoItems = [
    {
      name: "Brake Pads",
      brand: "Brembo",
      compatibility: "Toyota Camry 2018-2023",
      costPrice: 35.0,
      sellingPrice: 85.0,
      stock: 12,
      minStock: 10,
    },
    {
      name: "Oil Filter",
      brand: "Bosch",
      compatibility: "Honda Civic 2016-2022",
      costPrice: 8.0,
      sellingPrice: 24.5,
      stock: 30,
      minStock: 15,
    },
    {
      name: "Spark Plugs (x4)",
      brand: "NGK",
      compatibility: "Nissan Altima 2019-2023",
      costPrice: 22.0,
      sellingPrice: 62.0,
      stock: 45,
      minStock: 20,
    },
    {
      name: "Air Filter",
      brand: "Mann",
      compatibility: "Ford Focus 2017-2022",
      costPrice: 12.0,
      sellingPrice: 35.0,
      stock: 28,
      minStock: 10,
    },
    {
      name: "Alternator Belt",
      brand: "Gates",
      compatibility: "BMW 320i 2015-2020",
      costPrice: 45.0,
      sellingPrice: 120.0,
      stock: 8,
      minStock: 5,
    },
    {
      name: "Headlight Bulb H4",
      brand: "Philips",
      compatibility: "Universal",
      costPrice: 6.0,
      sellingPrice: 18.0,
      stock: 24,
      minStock: 12,
    },
    {
      name: "Timing Belt Kit",
      brand: "Continental",
      compatibility: "Nissan Altima 2017-2022",
      costPrice: 85.0,
      sellingPrice: 210.0,
      stock: 6,
      minStock: 5,
    },
    {
      name: "Radiator Hose",
      brand: "Dayco",
      compatibility: "Toyota Corolla 2014-2019",
      costPrice: 15.0,
      sellingPrice: 42.0,
      stock: 14,
      minStock: 8,
    },
  ];

  // Only seed inventory if the table is empty (avoid duplicates on re-run)
  const existingCount = await prisma.inventory.count();
  if (existingCount === 0) {
    const result = await prisma.inventory.createMany({ data: demoItems });
    console.log(`✅ Seeded ${result.count} inventory items`);
  } else {
    console.log(`⏭️  Inventory already has ${existingCount} items — skipping seed`);
  }
  console.log("\n🎉 Seed complete!");
  console.log("   Login with: owner@autopartspro.com / admin123");
  console.log("   Change this password after first login!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
