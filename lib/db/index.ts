import postgres from "postgres";
import {drizzle} from "drizzle-orm/postgres-js";
let client:ReturnType<typeof postgres>|undefined;
export function getDb(){const url=process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is not configured.");client??=postgres(url,{prepare:false,max:5,idle_timeout:20});return drizzle(client)}
export async function closeDb(){if(client){await client.end();client=undefined}}
