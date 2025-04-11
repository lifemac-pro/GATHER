// Using a simple type definition until drizzle-kit is installed
type Config = {
  schema: string;
  dialect: string;
  dbCredentials: {
    url: string;
  };
  tablesFilter: string[];
};

import { env } from "@/env.mjs";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  tablesFilter: ["GATHER_*"],
} satisfies Config;
