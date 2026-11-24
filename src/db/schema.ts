import { sql } from './client';

export async function initDatabase(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      edit_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
      full_name VARCHAR(120) NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('offer', 'need', 'split')),
      seats_available INTEGER NOT NULL DEFAULT 0 CHECK (seats_available >= 0 AND seats_available <= 15),
      outbound_is_office BOOLEAN NOT NULL DEFAULT FALSE,
      outbound_label VARCHAR(200) NOT NULL,
      outbound_lat DOUBLE PRECISION,
      outbound_lng DOUBLE PRECISION,
      return_label VARCHAR(200) NOT NULL,
      return_lat DOUBLE PRECISION,
      return_lng DOUBLE PRECISION,
      party_profile VARCHAR(20) NOT NULL CHECK (party_profile IN ('no_drink', 'will_drink', 'no_preference')),
      notes VARCHAR(200) NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_participants_role
    ON participants (role)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_participants_party_profile
    ON participants (party_profile)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_participants_updated_at
    ON participants (updated_at DESC)
  `;

  console.log('[db] Schema verificado e pronto.');
}
