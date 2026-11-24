import { Hono } from 'hono';
import { sql } from '../db/client';
import { haversineDistanceKm } from '../lib/haversine';
import { accessCodeMiddleware } from '../middleware/accessCode';
import type { ParticipantRow } from './participants';

type Trecho = 'ida' | 'volta';
type RequestStatus = 'pendente' | 'confirmada' | 'recusada' | 'cancelada';

interface RequestWithPeerRow {
  id: string;
  motorista_id: string;
  passageiro_id: string;
  trecho: Trecho;
  status: RequestStatus;
  criado_em: string;
  atualizado_em: string;
  peer_id: string;
  peer_name: string;
  peer_phone: string;
  peer_notes: string;
  peer_outbound_label: string | null;
  peer_outbound_lat: number | null;
  peer_outbound_lng: number | null;
  peer_return_label: string | null;
  peer_return_lat: number | null;
  peer_return_lng: number | null;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const requestsRoutes = new Hono();

requestsRoutes.use('*', accessCodeMiddleware);

async function authenticateByEditToken(
  editToken: string | undefined
): Promise<ParticipantRow | null> {
  if (!editToken || !UUID_REGEX.test(editToken)) {
    return null;
  }
  const [user] = await sql<ParticipantRow[]>`
    SELECT *
    FROM participants
    WHERE edit_token = ${editToken}
    LIMIT 1
  `;
  return user ?? null;
}

requestsRoutes.get('/mine', async (c) => {
  const me = await authenticateByEditToken(c.req.header('x-edit-token'));
  if (!me) {
    return c.json({ error: 'Identificacao invalida. Cadastre-se ou recupere seu perfil.' }, 403);
  }

  const [receivedRows, sentRows] = await Promise.all([
    sql<RequestWithPeerRow[]>`
      SELECT
        s.id,
        s.motorista_id,
        s.passageiro_id,
        s.trecho,
        s.status,
        s.criado_em,
        s.atualizado_em,
        p.id AS peer_id,
        p.full_name AS peer_name,
        p.phone AS peer_phone,
        p.notes AS peer_notes,
        p.outbound_label AS peer_outbound_label,
        p.outbound_lat AS peer_outbound_lat,
        p.outbound_lng AS peer_outbound_lng,
        p.return_label AS peer_return_label,
        p.return_lat AS peer_return_lat,
        p.return_lng AS peer_return_lng
      FROM solicitacoes_carona s
      INNER JOIN participants p ON p.id = s.passageiro_id
      WHERE s.motorista_id = ${me.id}
        AND s.status IN ('pendente', 'confirmada')
      ORDER BY
        CASE s.status WHEN 'pendente' THEN 1 ELSE 2 END,
        s.criado_em ASC
    `,
    sql<RequestWithPeerRow[]>`
      SELECT
        s.id,
        s.motorista_id,
        s.passageiro_id,
        s.trecho,
        s.status,
        s.criado_em,
        s.atualizado_em,
        p.id AS peer_id,
        p.full_name AS peer_name,
        p.phone AS peer_phone,
        p.notes AS peer_notes,
        p.outbound_label AS peer_outbound_label,
        p.outbound_lat AS peer_outbound_lat,
        p.outbound_lng AS peer_outbound_lng,
        p.return_label AS peer_return_label,
        p.return_lat AS peer_return_lat,
        p.return_lng AS peer_return_lng
      FROM solicitacoes_carona s
      INNER JOIN participants p ON p.id = s.motorista_id
      WHERE s.passageiro_id = ${me.id}
        AND s.status <> 'cancelada'
      ORDER BY s.atualizado_em DESC
    `,
  ]);

  const mapItem = (row: RequestWithPeerRow) => {
    const isIda = row.trecho === 'ida';
    const myLat = isIda ? me.outbound_lat : me.return_lat;
    const myLng = isIda ? me.outbound_lng : me.return_lng;
    const peerLat = isIda ? row.peer_outbound_lat : row.peer_return_lat;
    const peerLng = isIda ? row.peer_outbound_lng : row.peer_return_lng;
    const locationLabel = isIda
      ? row.peer_outbound_label ?? ''
      : row.peer_return_label ?? '';

    return {
      id: row.id,
      motoristaId: row.motorista_id,
      passageiroId: row.passageiro_id,
      trecho: row.trecho,
      status: row.status,
      criadoEm: row.criado_em,
      peer: {
        id: row.peer_id,
        fullName: row.peer_name,
        phone: row.peer_phone,
        notes: row.peer_notes,
        locationLabel,
        distanceKm: haversineDistanceKm(myLat, myLng, peerLat, peerLng),
      },
    };
  };

  const received = receivedRows.map(mapItem);
  const sent = sentRows.map(mapItem);

  const confirmedIda = received.filter(
    (r) => r.trecho === 'ida' && r.status === 'confirmada'
  ).length;
  const confirmedVolta = received.filter(
    (r) => r.trecho === 'volta' && r.status === 'confirmada'
  ).length;
  const pendingCount = received.filter((r) => r.status === 'pendente').length;

  return c.json({
    pendingCount,
    driverSummary: {
      offersIda: me.outbound_role === 'offer',
      offersVolta: me.return_role === 'offer',
      vagasIda: me.vagas_ida,
      vagasVolta: me.vagas_volta,
      confirmedIda,
      confirmedVolta,
      remainingIda: Math.max(0, me.vagas_ida - confirmedIda),
      remainingVolta: Math.max(0, me.vagas_volta - confirmedVolta),
    },
    received,
    sent,
  });
});

requestsRoutes.post('/', async (c) => {
  const passenger = await authenticateByEditToken(c.req.header('x-edit-token'));
  if (!passenger) {
    return c.json(
      { error: 'Cadastre sua rota antes de solicitar uma carona.' },
      403
    );
  }

  const body = await c.req.json().catch(() => null);
  const motoristaId =
    body && typeof body === 'object' && typeof body.motoristaId === 'string'
      ? body.motoristaId
      : '';
  const trecho =
    body && typeof body === 'object' && (body.trecho === 'ida' || body.trecho === 'volta')
      ? (body.trecho as Trecho)
      : null;

  if (!UUID_REGEX.test(motoristaId) || !trecho) {
    return c.json({ error: 'Motorista ou trecho invalido.' }, 400);
  }

  if (motoristaId === passenger.id) {
    return c.json(
      { error: 'Voce nao pode solicitar carona para si mesmo.' },
      400
    );
  }

  const [driver] = await sql<ParticipantRow[]>`
    SELECT *
    FROM participants
    WHERE id = ${motoristaId}
    LIMIT 1
  `;

  if (!driver) {
    return c.json({ error: 'Motorista nao encontrado.' }, 404);
  }

  const offersSegment =
    trecho === 'ida'
      ? driver.outbound_role === 'offer'
      : driver.return_role === 'offer';
  const totalSeats = trecho === 'ida' ? driver.vagas_ida : driver.vagas_volta;

  if (!offersSegment || totalSeats <= 0) {
    return c.json(
      { error: 'Este participante nao esta oferecendo vagas neste trecho.' },
      400
    );
  }

  const [confirmedCount] = await sql<{ total: number }[]>`
    SELECT COUNT(*)::int AS total
    FROM solicitacoes_carona
    WHERE motorista_id = ${motoristaId}
      AND trecho = ${trecho}
      AND status = 'confirmada'
  `;

  if (Number(confirmedCount?.total ?? 0) >= totalSeats) {
    return c.json(
      { error: 'Todas as vagas deste motorista neste trecho ja estao preenchidas.' },
      409
    );
  }

  try {
    const [created] = await sql<{
      id: string;
      motorista_id: string;
      passageiro_id: string;
      trecho: Trecho;
      status: RequestStatus;
      criado_em: string;
    }[]>`
      INSERT INTO solicitacoes_carona (motorista_id, passageiro_id, trecho, status)
      VALUES (${motoristaId}, ${passenger.id}, ${trecho}, 'pendente')
      RETURNING id, motorista_id, passageiro_id, trecho, status, criado_em
    `;

    return c.json(
      {
        request: {
          id: created.id,
          motoristaId: created.motorista_id,
          passageiroId: created.passageiro_id,
          trecho: created.trecho,
          status: created.status,
          criadoEm: created.criado_em,
        },
      },
      201
    );
  } catch (error: unknown) {
    const pgCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';

    if (pgCode === '23505') {
      return c.json(
        {
          error:
            'Voce ja possui uma solicitacao ativa com este motorista para este trecho.',
        },
        409
      );
    }

    console.error('[requests] Erro ao criar solicitacao:', error);
    return c.json({ error: 'Erro interno ao enviar solicitacao.' }, 500);
  }
});

requestsRoutes.patch('/:id/status', async (c) => {
  const actor = await authenticateByEditToken(c.req.header('x-edit-token'));
  if (!actor) {
    return c.json({ error: 'Permissao invalida.' }, 403);
  }

  const requestId = c.req.param('id');
  if (!UUID_REGEX.test(requestId)) {
    return c.json({ error: 'Solicitacao invalida.' }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const nextStatus =
    body &&
    typeof body === 'object' &&
    (body.status === 'confirmada' ||
      body.status === 'recusada' ||
      body.status === 'cancelada')
      ? (body.status as 'confirmada' | 'recusada' | 'cancelada')
      : null;

  if (!nextStatus) {
    return c.json({ error: 'Status invalido.' }, 400);
  }

  try {
    const result = await sql.begin(async (rawTx) => {
      const tx = rawTx as unknown as typeof sql;
      const [existing] = await tx<{
        id: string;
        motorista_id: string;
        passageiro_id: string;
        trecho: Trecho;
        status: RequestStatus;
      }[]>`
        SELECT id, motorista_id, passageiro_id, trecho, status
        FROM solicitacoes_carona
        WHERE id = ${requestId}
        FOR UPDATE
      `;

      if (!existing) {
        return { error: 'Solicitacao nao encontrada.', statusCode: 404 as const };
      }

      const isDriver = existing.motorista_id === actor.id;
      const isPassenger = existing.passageiro_id === actor.id;

      if (!isDriver && !isPassenger) {
        return { error: 'Voce nao tem permissao nesta solicitacao.', statusCode: 403 as const };
      }

      if (nextStatus === 'confirmada') {
        if (!isDriver) {
          return {
            error: 'Apenas o motorista pode confirmar uma solicitacao.',
            statusCode: 403 as const,
          };
        }
        if (existing.status !== 'pendente') {
          return {
            error: 'Esta solicitacao nao esta mais pendente.',
            statusCode: 409 as const,
          };
        }

        // Bloqueia o registro do motorista na transacao para evitar overbooking
        const [driver] = await tx<ParticipantRow[]>`
          SELECT *
          FROM participants
          WHERE id = ${existing.motorista_id}
          FOR UPDATE
        `;

        const totalSeats =
          existing.trecho === 'ida' ? driver.vagas_ida : driver.vagas_volta;

        const [confirmedCount] = await tx<{ total: number }[]>`
          SELECT COUNT(*)::int AS total
          FROM solicitacoes_carona
          WHERE motorista_id = ${existing.motorista_id}
            AND trecho = ${existing.trecho}
            AND status = 'confirmada'
        `;

        if (Number(confirmedCount?.total ?? 0) >= totalSeats) {
          return {
            error: 'Todas as vagas deste trecho ja foram preenchidas.',
            statusCode: 409 as const,
          };
        }
      } else if (nextStatus === 'recusada') {
        if (!isDriver) {
          return {
            error: 'Apenas o motorista pode recusar uma solicitacao.',
            statusCode: 403 as const,
          };
        }
      } else if (nextStatus === 'cancelada') {
        if (!isPassenger && !isDriver) {
          return { error: 'Permissao negada.', statusCode: 403 as const };
        }
      }

      const [updated] = await tx<{
        id: string;
        motorista_id: string;
        passageiro_id: string;
        trecho: Trecho;
        status: RequestStatus;
      }[]>`
        UPDATE solicitacoes_carona
        SET status = ${nextStatus}, atualizado_em = NOW()
        WHERE id = ${requestId}
        RETURNING id, motorista_id, passageiro_id, trecho, status
      `;

      return { updated, statusCode: 200 as const };
    });

    if ('error' in result) {
      return c.json({ error: result.error }, result.statusCode);
    }

    return c.json({
      request: {
        id: result.updated.id,
        motoristaId: result.updated.motorista_id,
        passageiroId: result.updated.passageiro_id,
        trecho: result.updated.trecho,
        status: result.updated.status,
      },
    });
  } catch (error) {
    console.error('[requests] Erro ao atualizar status:', error);
    return c.json({ error: 'Erro interno ao atualizar solicitacao.' }, 500);
  }
});
