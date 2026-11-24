import { sql } from './client';

export async function initDatabase(): Promise<void> {
  // 1. Tabela base de participantes (compativel com bancos novos e existentes)
  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      edit_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
      full_name VARCHAR(120) NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      role VARCHAR(20) NOT NULL DEFAULT 'offer' CHECK (role IN ('offer', 'need', 'split')),
      seats_available INTEGER NOT NULL DEFAULT 0 CHECK (seats_available >= 0 AND seats_available <= 15),
      outbound_is_office BOOLEAN NOT NULL DEFAULT FALSE,
      outbound_label VARCHAR(200) DEFAULT '',
      outbound_lat DOUBLE PRECISION,
      outbound_lng DOUBLE PRECISION,
      return_label VARCHAR(200) DEFAULT '',
      return_lat DOUBLE PRECISION,
      return_lng DOUBLE PRECISION,
      party_profile VARCHAR(20) NOT NULL DEFAULT 'no_preference' CHECK (party_profile IN ('no_drink', 'will_drink', 'no_preference')),
      notes VARCHAR(200) NOT NULL DEFAULT '',
      trip_scope VARCHAR(20) NOT NULL DEFAULT 'both',
      outbound_role VARCHAR(20) NOT NULL DEFAULT 'offer',
      return_role VARCHAR(20) NOT NULL DEFAULT 'offer',
      vagas_ida INTEGER NOT NULL DEFAULT 0,
      vagas_volta INTEGER NOT NULL DEFAULT 0,
      migrated_v2 BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // 2. Migrations incrementais para volumes Docker ja existentes
  await sql`
    ALTER TABLE participants
    ADD COLUMN IF NOT EXISTS trip_scope VARCHAR(20) NOT NULL DEFAULT 'both'
  `;
  await sql`
    ALTER TABLE participants
    ADD COLUMN IF NOT EXISTS outbound_role VARCHAR(20) NOT NULL DEFAULT 'offer'
  `;
  await sql`
    ALTER TABLE participants
    ADD COLUMN IF NOT EXISTS return_role VARCHAR(20) NOT NULL DEFAULT 'offer'
  `;
  await sql`
    ALTER TABLE participants
    ADD COLUMN IF NOT EXISTS vagas_ida INTEGER NOT NULL DEFAULT 0
  `;
  await sql`
    ALTER TABLE participants
    ADD COLUMN IF NOT EXISTS vagas_volta INTEGER NOT NULL DEFAULT 0
  `;
  await sql`
    ALTER TABLE participants
    ADD COLUMN IF NOT EXISTS migrated_v2 BOOLEAN NOT NULL DEFAULT FALSE
  `;

  // Permite cadastro "Apenas ida" ou "Apenas volta" sem exigir ambos os labels
  await sql`
    ALTER TABLE participants
    ALTER COLUMN outbound_label DROP NOT NULL
  `;
  await sql`
    ALTER TABLE participants
    ALTER COLUMN return_label DROP NOT NULL
  `;
  await sql`
    ALTER TABLE participants
    ALTER COLUMN outbound_label SET DEFAULT ''
  `;
  await sql`
    ALTER TABLE participants
    ALTER COLUMN return_label SET DEFAULT ''
  `;

  // Backfill idempotente de registros criados na versao anterior
  await sql`
    UPDATE participants
    SET
      trip_scope = 'both',
      outbound_role = role,
      return_role = CASE
        WHEN role = 'offer' AND party_profile = 'will_drink' THEN 'need'
        ELSE role
      END,
      vagas_ida = CASE WHEN role = 'offer' THEN seats_available ELSE 0 END,
      vagas_volta = CASE
        WHEN role = 'offer' AND party_profile <> 'will_drink' THEN seats_available
        ELSE 0
      END,
      migrated_v2 = TRUE
    WHERE migrated_v2 = FALSE
  `;

  // 3. Nova tabela de solicitacoes de carona
  await sql`
    CREATE TABLE IF NOT EXISTS solicitacoes_carona (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      motorista_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      passageiro_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      trecho VARCHAR(10) NOT NULL CHECK (trecho IN ('ida', 'volta')),
      status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'recusada', 'cancelada')),
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT chk_motorista_diferente_passageiro CHECK (motorista_id <> passageiro_id)
    )
  `;

  // Constraint de unicidade para evitar solicitacoes duplicadas ativas (pendente ou confirmada)
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_solicitacoes_unique_active
    ON solicitacoes_carona (motorista_id, passageiro_id, trecho)
    WHERE status IN ('pendente', 'confirmada')
  `;

  // Indices de consulta
  await sql`
    CREATE INDEX IF NOT EXISTS idx_participants_outbound_role
    ON participants (outbound_role)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_participants_return_role
    ON participants (return_role)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_participants_party_profile
    ON participants (party_profile)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_participants_updated_at
    ON participants (updated_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_motorista
    ON solicitacoes_carona (motorista_id, trecho, status)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_solicitacoes_passageiro
    ON solicitacoes_carona (passageiro_id, trecho, status)
  `;

  console.log('[db] Schema e migrations verificados e prontos.');
}
