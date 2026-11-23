import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await connectDatabase();
    const server = app.listen(PORT);
    server.on("listening", () => {
      const address = server.address();
      console.log(`Akshar AI API running at http://localhost:${address.port}`);
    });
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        const nextPort = PORT + 1;
        console.warn(`Port ${PORT} is already in use; trying port ${nextPort}.`);
        const fallback = app.listen(nextPort);
        fallback.on("listening", () => {
          const address = fallback.address();
          console.log(`Akshar AI API running at http://localhost:${address.port}`);
        });
        fallback.on("error", (fallbackError) => {
          console.error(`Could not start API on port ${nextPort}:`, fallbackError.message);
          process.exitCode = 1;
        });
        return;
      }
      console.error("API listener failed:", error);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
