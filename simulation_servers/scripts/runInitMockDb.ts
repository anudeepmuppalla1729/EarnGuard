import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

// Use Session Mode (Port 5432) for initialization to avoid ECONNRESET on large SQL scripts
const initPool = new Pool({
  connectionString:
    "postgresql://postgres.vxtxxszjibmxkyqhejpm:deepu123mac@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initMockDb() {
  try {
    const sqlPath = path.join(__dirname, "init_mock_db.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Executing init_mock_db.sql in individual chunks...");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log(`> Executing: ${statement.substring(0, 50)}...`);
      await initPool.query(statement);
    }

    console.log("Mock Database schema fully initialized successfully!");

    await initPool.end();
    process.exit(0);
  } catch (error) {
    console.error("Failed to initialize local Mock DB schema:", error);
    process.exit(1);
  }
}

initMockDb();
