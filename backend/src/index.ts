import { env } from "./config/env";
import app from "./app";

async function main() {
  // Prisma connects lazily on first query — explicit $connect() is not needed
  // and causes P2024 timeouts against pgBouncer at startup.
  console.log("Starting server...");

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
