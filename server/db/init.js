const fs = require("fs");
const path = require("path");
const db = require("./index");

const schemaPath = path.join(__dirname, "schemas.sql");
const sampleChannels = [
  "general",
  "introduce-yourself",
  "welcome",
  "programming",
  "gaming",
];

async function initDatabase() {
  await db.client.connect();

  try {
    const schema = fs.readFileSync(schemaPath, "utf8");
    await db.client.query(schema);

    for (const name of sampleChannels) {
      await db.client.query(
        "INSERT INTO channels (name) SELECT $1 WHERE NOT EXISTS (SELECT 1 FROM channels WHERE name = $1)",
        [name]
      );
    }

    console.info("Database initialized successfully");
  } finally {
    await db.client.end();
  }
}

initDatabase().catch((error) => {
  console.error("Database initialization failed:", error);
  process.exit(1);
});
