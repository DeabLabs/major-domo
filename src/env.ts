import { z } from "zod";
import { parseEnv } from "znv";

export const ENV = parseEnv(process.env, {
  DISCORD_TOKEN: z.string(),
});
