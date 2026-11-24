import { Hono } from 'hono';
import { config } from '../config';
import { sql } from '../db/client';
import { haversineDistanceKm } from '../lib/haversine';
import {
  normalizePhone,
  validateParticipantInput,
  type LegacyRole,
  type PartyProfile,
  type SegmentRole,
  type TripScope,
} from '../lib/validation';
import { accessCodeMiddleware } from '../middleware/accessCode';

export interface ParticipantRow {
  id: string;
  edit_token: string;
  full_name: string;
  phone: string;
  role: LegacyRole;
  seats_available: number;
  trip_scope: TripScope;
  outbound_role: SegmentRole;
  return_role: SegmentRole;
  vagas_ida: number;
  vagas_volta: number;
  outbound_is_office: boolean;
  outbound_label: string | null;
  outbound_lat: number | null;
  outbound_lng: number | null;
  return_label: string | null;
  return_lat: number | null;
  return_lng: number | null;
  party_profile: PartyProfile;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ConfirmedCountRow {
  motorista_id: string;
  trecho: 'ida' | 'volta';
  total: number;
}

interface MyRequestRow {
  id: string;
  motorista_id: string;
  status: 'pendente' | 'confirmada' | 'recusada' | 'cancelada';
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function serializePublicParticipant(
  row: ParticipantRow,
  options?: {
    direction?: 'outbound' | 'return';
    distanceKm?: number | null;
    isMe?: boolean;
    confirmedIda?: number;
    confirmedVolta?: number;
    myRequest?: {
      id: string;
      status: 'pendente' | 'confirmada' | 'recusada' | 'cancelada';
    } | null;
  }
) {
  const direction = options?.direction ?? 'outbound';
  const confirmedIda = options?.confirmedIda ?? 0;
  const confirmedVolta = options?.confirmedVolta ?? 0;

  const remainingIda =
    row.outbound_role === 'offer'
      ? Math.max(0, row.vagas_ida - confirmedIda)
      : 0;
  const remainingVolta =
    row.return_role === 'offer'
      ? Math.max(0, row.vagas_volta - confirmedVolta)
      : 0;

  const activeRole =
    direction === 'outbound' ? row.outbound_role : row.return_role;
  const seatsTotal =
    direction === 'outbound' ? row.vagas_ida : row.vagas_volta;
  const seatsConfirmed =
    direction === 'outbound' ? confirmedIda : confirmedVolta;
  const seatsRemaining =
    direction === 'outbound' ? remainingIda : remainingVolta;

  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    tripScope: row.trip_scope,
    role: activeRole,
    outboundRole: row.outbound_role,
    returnRole: row.return_role,
    vagasIda: row.vagas_ida,
    vagasVolta: row.vagas_volta,
    confirmedIda,
    confirmedVolta,
    remainingIda,
    remainingVolta,
    seatsTotal,
    seatsConfirmed,
    seatsRemaining,
    seatsAvailable: seatsRemaining,
    outboundIsOffice: row.outbound_is_office,
    outboundLabel: row.outbound_label ?? '',
    outboundLat: row.outbound_lat,
    outboundLng: row.outbound_lng,
    returnLabel: row.return_label ?? '',
    returnLat: row.return_lat,
    returnLng: row.return_lng,
    partyProfile: row.party_profile,
    notes: row.notes,
    distanceKm: options?.distanceKm ?? null,
    isMe: options?.isMe ?? false,
    myRequest: options?.myRequest ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const participantsRoutes = new Hono();

participantsRoutes.use('*', accessCodeMiddleware);

participantsRoutes.get('/', async (c) => {
  const direction = c.req.query('direction') === 'return' ? 'return' : 'outbound';
  const trecho: 'ida' | 'volta' = direction === 'outbound' ? 'ida' : 'volta';
  const myId = c.req.query('myId');
  const roleFilter = c.req.query('role');
  const onlyWithSeats = c.req.query('onlyWithSeats') === 'true';
  const noDrinkOnly = c.req.query('noDrinkOnly') === 'true';

  const queryLat = c.req.query('lat');
  const queryLng = c.req.query('lng');

  const [rows, confirmedRows] = await Promise.all([
    sql<ParticipantRow[]>`
      SELECT *
      FROM participants
      ORDER BY updated_at DESC
    `,
    sql<ConfirmedCountRow[]>`
      SELECT motorista_id, trecho, COUNT(*)::int AS total
      FROM solicitacoes_carona
      WHERE status = 'confirmada'
      GROUP BY motorista_id, trecho
    `,
  ]);

  const confirmedMap = new Map<string, number>();
  for (const item of confirmedRows) {
    confirmedMap.set(`${item.motorista_id}:${item.trecho}`, Number(item.total));
  }

  const getConfirmed = (id: string, seg: 'ida' | 'volta') =>
    confirmedMap.get(`${id}:${seg}`) ?? 0;

  let meRow: ParticipantRow | undefined;
  let myRequestsMap = new Map<
    string,
    { id: string; status: 'pendente' | 'confirmada' | 'recusada' | 'cancelada' }
  >();
  let pendingReceivedCount = 0;

  if (myId && UUID_REGEX.test(myId)) {
    meRow = rows.find((row) => row.id === myId);
    if (meRow) {
      const [sentForDirection, pendingCountRows] = await Promise.all([
        sql<MyRequestRow[]>`
          SELECT DISTINCT ON (motorista_id) id, motorista_id, status
          FROM solicitacoes_carona
          WHERE passageiro_id = ${myId}
            AND trecho = ${trecho}
            AND status <> 'cancelada'
          ORDER BY motorista_id,
            CASE status
              WHEN 'confirmada' THEN 1
              WHEN 'pendente' THEN 2
              ELSE 3
            END,
            atualizado_em DESC
        `,
        sql<{ total: number }[]>`
          SELECT COUNT(*)::int AS total
          FROM solicitacoes_carona
          WHERE motorista_id = ${myId}
            AND status = 'pendente'
        `,
      ]);

      for (const req of sentForDirection) {
        myRequestsMap.set(req.motorista_id, {
          id: req.id,
          status: req.status,
        });
      }
      pendingReceivedCount = Number(pendingCountRows[0]?.total ?? 0);
    }
  }

  let refLat: number | null = null;
  let refLng: number | null = null;
  let referenceSource: 'user' | 'query' | 'office' | 'none' = 'none';

  if (meRow) {
    refLat = direction === 'outbound' ? meRow.outbound_lat : meRow.return_lat;
    refLng = direction === 'outbound' ? meRow.outbound_lng : meRow.return_lng;
    if (refLat !== null && refLng !== null) {
      referenceSource = 'user';
    }
  } else if (queryLat && queryLng) {
    const parsedLat = Number(queryLat);
    const parsedLng = Number(queryLng);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      refLat = parsedLat;
      refLng = parsedLng;
      referenceSource = 'query';
    }
  }

  if (refLat === null && refLng === null && direction === 'outbound') {
    refLat = config.spsOffice.lat;
    refLng = config.spsOffice.lng;
    referenceSource = 'office';
  }

  // Participantes ativos no trecho selecionado
  const activeInDirection = rows.filter((row) => {
    const segRole = direction === 'outbound' ? row.outbound_role : row.return_role;
    return segRole !== 'none';
  });

  const filtered = activeInDirection.filter((row) => {
    const segRole = direction === 'outbound' ? row.outbound_role : row.return_role;
    if (roleFilter && ['offer', 'need', 'split'].includes(roleFilter)) {
      if (segRole !== roleFilter) return false;
    }
    if (onlyWithSeats) {
      const total = direction === 'outbound' ? row.vagas_ida : row.vagas_volta;
      const remaining = Math.max(0, total - getConfirmed(row.id, trecho));
      if (segRole !== 'offer' || remaining <= 0) return false;
    }
    if (noDrinkOnly) {
      if (row.party_profile !== 'no_drink') return false;
    }
    return true;
  });

  const mapped = filtered.map((row) => {
    const targetLat = direction === 'outbound' ? row.outbound_lat : row.return_lat;
    const targetLng = direction === 'outbound' ? row.outbound_lng : row.return_lng;
    const isMe = Boolean(meRow && row.id === meRow.id);
    const distanceKm = isMe
      ? 0
      : haversineDistanceKm(refLat, refLng, targetLat, targetLng);

    return serializePublicParticipant(row, {
      direction,
      distanceKm,
      isMe,
      confirmedIda: getConfirmed(row.id, 'ida'),
      confirmedVolta: getConfirmed(row.id, 'volta'),
      myRequest: myRequestsMap.get(row.id) ?? null,
    });
  });

  mapped.sort((a, b) => {
    const distA = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const distB = b.distanceKm ?? Number.POSITIVE_INFINITY;
    if (distA !== distB) return distA - distB;
    if (b.seatsRemaining !== a.seatsRemaining) {
      return b.seatsRemaining - a.seatsRemaining;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Estatisticas do trecho ativo
  const stats = {
    totalParticipants: activeInDirection.length,
    driversOffering: activeInDirection.filter((r) =>
      direction === 'outbound'
        ? r.outbound_role === 'offer'
        : r.return_role === 'offer'
    ).length,
    totalSeatsOpen: activeInDirection.reduce((sum, r) => {
      const isDriver =
        direction === 'outbound'
          ? r.outbound_role === 'offer'
          : r.return_role === 'offer';
      if (!isDriver) return sum;
      const total = direction === 'outbound' ? r.vagas_ida : r.vagas_volta;
      const remaining = Math.max(0, total - getConfirmed(r.id, trecho));
      return sum + remaining;
    }, 0),
    needingRide: activeInDirection.filter((r) =>
      direction === 'outbound'
        ? r.outbound_role === 'need'
        : r.return_role === 'need'
    ).length,
    splittingApp: activeInDirection.filter((r) =>
      direction === 'outbound'
        ? r.outbound_role === 'split'
        : r.return_role === 'split'
    ).length,
  };

  return c.json({
    direction,
    referenceSource,
    pendingReceivedCount,
    me: meRow
      ? serializePublicParticipant(meRow, {
          direction,
          distanceKm: 0,
          isMe: true,
          confirmedIda: getConfirmed(meRow.id, 'ida'),
          confirmedVolta: getConfirmed(meRow.id, 'volta'),
        })
      : null,
    stats,
    participants: mapped,
  });
});

participantsRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const validation = validateParticipantInput(body);

  if (!validation.ok) {
    return c.json({ error: validation.error }, 400);
  }

  const d = validation.data;

  try {
    const [created] = await sql<ParticipantRow[]>`
      INSERT INTO participants (
        full_name,
        phone,
        role,
        seats_available,
        trip_scope,
        outbound_role,
        return_role,
        vagas_ida,
        vagas_volta,
        outbound_is_office,
        outbound_label,
        outbound_lat,
        outbound_lng,
        return_label,
        return_lat,
        return_lng,
        party_profile,
        notes,
        migrated_v2
      )
      VALUES (
        ${d.fullName},
        ${d.phone},
        ${d.role},
        ${d.seatsAvailable},
        ${d.tripScope},
        ${d.outboundRole},
        ${d.returnRole},
        ${d.vagasIda},
        ${d.vagasVolta},
        ${d.outboundIsOffice},
        ${d.outboundLabel},
        ${d.outboundLat},
        ${d.outboundLng},
        ${d.returnLabel},
        ${d.returnLat},
        ${d.returnLng},
        ${d.partyProfile},
        ${d.notes},
        TRUE
      )
      RETURNING *
    `;

    return c.json(
      {
        participant: serializePublicParticipant(created, { isMe: true }),
        editToken: created.edit_token,
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
            'Ja existe um cadastro com este WhatsApp. Use a opcao "Ja tenho cadastro" para editar seus dados.',
        },
        409
      );
    }

    console.error('[participants] Erro ao criar:', error);
    return c.json({ error: 'Erro interno ao salvar cadastro.' }, 500);
  }
});

participantsRoutes.post('/lookup', async (c) => {
  const body = await c.req.json().catch(() => null);
  const rawPhone =
    body && typeof body === 'object' && typeof body.phone === 'string'
      ? body.phone
      : '';
  const phone = normalizePhone(rawPhone);

  if (phone.length < 10 || phone.length > 11) {
    return c.json(
      { error: 'Informe um numero de WhatsApp valido com DDD.' },
      400
    );
  }

  const [found] = await sql<ParticipantRow[]>`
    SELECT *
    FROM participants
    WHERE phone = ${phone}
    LIMIT 1
  `;

  if (!found) {
    return c.json(
      { error: 'Nenhum cadastro encontrado para este numero de WhatsApp.' },
      404
    );
  }

  return c.json({
    participant: serializePublicParticipant(found, { isMe: true }),
    editToken: found.edit_token,
  });
});

participantsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const editToken = c.req.header('x-edit-token');

  if (!UUID_REGEX.test(id) || !editToken || !UUID_REGEX.test(editToken)) {
    return c.json({ error: 'Permissao invalida para editar este cadastro.' }, 403);
  }

  const body = await c.req.json().catch(() => null);
  const validation = validateParticipantInput(body);

  if (!validation.ok) {
    return c.json({ error: validation.error }, 400);
  }

  const d = validation.data;

  try {
    const [updated] = await sql<ParticipantRow[]>`
      UPDATE participants
      SET
        full_name = ${d.fullName},
        phone = ${d.phone},
        role = ${d.role},
        seats_available = ${d.seatsAvailable},
        trip_scope = ${d.tripScope},
        outbound_role = ${d.outboundRole},
        return_role = ${d.returnRole},
        vagas_ida = ${d.vagasIda},
        vagas_volta = ${d.vagasVolta},
        outbound_is_office = ${d.outboundIsOffice},
        outbound_label = ${d.outboundLabel},
        outbound_lat = ${d.outboundLat},
        outbound_lng = ${d.outboundLng},
        return_label = ${d.returnLabel},
        return_lat = ${d.returnLat},
        return_lng = ${d.returnLng},
        party_profile = ${d.partyProfile},
        notes = ${d.notes},
        migrated_v2 = TRUE,
        updated_at = NOW()
      WHERE id = ${id} AND edit_token = ${editToken}
      RETURNING *
    `;

    if (!updated) {
      return c.json(
        { error: 'Cadastro nao encontrado ou token de edicao invalido.' },
        404
      );
    }

    return c.json({
      participant: serializePublicParticipant(updated, { isMe: true }),
    });
  } catch (error: unknown) {
    const pgCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';

    if (pgCode === '23505') {
      return c.json(
        { error: 'Este numero de WhatsApp ja esta em uso por outro participante.' },
        409
      );
    }

    console.error('[participants] Erro ao atualizar:', error);
    return c.json({ error: 'Erro interno ao atualizar cadastro.' }, 500);
  }
});

participantsRoutes.patch('/:id/seats', async (c) => {
  const id = c.req.param('id');
  const editToken = c.req.header('x-edit-token');

  if (!UUID_REGEX.test(id) || !editToken || !UUID_REGEX.test(editToken)) {
    return c.json({ error: 'Permissao invalida para atualizar vagas.' }, 403);
  }

  const body = await c.req.json().catch(() => null);
  const seats =
    body && typeof body === 'object' ? Number(body.seatsAvailable) : NaN;
  const trecho =
    body && typeof body === 'object' && (body.trecho === 'ida' || body.trecho === 'volta')
      ? (body.trecho as 'ida' | 'volta')
      : null;

  if (!Number.isInteger(seats) || seats < 0 || seats > 15) {
    return c.json(
      { error: 'Informe uma quantidade valida de vagas (0 a 15).' },
      400
    );
  }

  let updated: ParticipantRow | undefined;

  if (trecho === 'ida') {
    [updated] = await sql<ParticipantRow[]>`
      UPDATE participants
      SET
        vagas_ida = ${seats},
        seats_available = GREATEST(${seats}, vagas_volta),
        updated_at = NOW()
      WHERE id = ${id} AND edit_token = ${editToken} AND outbound_role = 'offer'
      RETURNING *
    `;
  } else if (trecho === 'volta') {
    [updated] = await sql<ParticipantRow[]>`
      UPDATE participants
      SET
        vagas_volta = ${seats},
        seats_available = GREATEST(vagas_ida, ${seats}),
        updated_at = NOW()
      WHERE id = ${id} AND edit_token = ${editToken} AND return_role = 'offer'
      RETURNING *
    `;
  } else {
    [updated] = await sql<ParticipantRow[]>`
      UPDATE participants
      SET
        vagas_ida = CASE WHEN outbound_role = 'offer' THEN ${seats} ELSE vagas_ida END,
        vagas_volta = CASE WHEN return_role = 'offer' THEN ${seats} ELSE vagas_volta END,
        seats_available = ${seats},
        updated_at = NOW()
      WHERE id = ${id} AND edit_token = ${editToken} AND (outbound_role = 'offer' OR return_role = 'offer')
      RETURNING *
    `;
  }

  if (!updated) {
    return c.json(
      { error: 'Cadastro de motorista nao encontrado para este trecho.' },
      404
    );
  }

  return c.json({
    participant: serializePublicParticipant(updated, { isMe: true }),
  });
});

participantsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const editToken = c.req.header('x-edit-token');

  if (!UUID_REGEX.test(id) || !editToken || !UUID_REGEX.test(editToken)) {
    return c.json({ error: 'Permissao invalida para remover este cadastro.' }, 403);
  }

  const [deleted] = await sql<{ id: string }[]>`
    DELETE FROM participants
    WHERE id = ${id} AND edit_token = ${editToken}
    RETURNING id
  `;

  if (!deleted) {
    return c.json(
      { error: 'Cadastro nao encontrado ou token invalido.' },
      404
    );
  }

  return c.json({ deleted: true, id: deleted.id });
});
