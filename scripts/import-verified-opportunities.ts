import "dotenv/config";
import { initDatabaseSync } from "../server/services/db-sync";

async function main() {
  const result = await initDatabaseSync();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
