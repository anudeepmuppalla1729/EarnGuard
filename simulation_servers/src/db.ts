import { Pool } from "pg";
import "dotenv/config";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.vxtxxszjibmxkyqhejpm:deepu123mac@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false,
  },
});

// Debug
pool
  .connect()
  .then(() => console.log("✅ DB connected"))
  .catch((err) => console.error("❌ DB connection error:", err));

pool.on("error", (err) => {
  console.error("Mock DB Unexpected error on idle client", err);
});
