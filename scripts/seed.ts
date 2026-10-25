import { connectDB } from "../src/lib/db/connect";
import { seedDatabase as seedCore } from "../src/lib/db/seed";

export async function seedDatabase() {
  await connectDB();
  await seedCore();
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Seeding failed:", err);
      process.exit(1);
    });
}
