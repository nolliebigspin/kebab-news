import { Client } from "@upstash/qstash";

import { env } from "@/lib/env";

/**
 * QStash client — initialized at module load.
 *
 * Phase 1: present but never invoked.
 * Phase 6+: used to dispatch deep-dive workflow jobs.
 *
 * Construction is safe with missing/placeholder token: the Client constructor
 * accepts token as optional and makes no network call at init time.
 */
export const qstash = new Client({
  token: env.QSTASH_TOKEN,
  baseUrl: env.QSTASH_URL,
});

export type QStashClient = typeof qstash;
