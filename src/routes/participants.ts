import { Hono } from 'hono';
import { config } from '../config';
import { sql } from '../db/client';
import { haversineDistanceKm } from '../lib/haversine';
import {
  normalizePhone,
  validateParticipantInput,
  type ParticipantRole,
  type PartyProfile,
} from '../lib/validation';
import { accessCodeMiddleware } from '../middleware/accessCode';

interface ParticipantRow {
  id: string;
  edit_token: string;
  full_name: string;
  phone: string;
  role: ParticipantRole;
  seats_available: number;
  outbound_is_office: boolean;
  outbound_label: string;
  outbound_lat: number | null;
  outbound_lng: number | null;
  return_label: string;
  return_lat: number | null;
  return_lng: number | null;
  party_profile: PartyProfile;
  notes: string;
  created_at: string;
  updated_at: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function serializePublicParticipant(
  row: ParticipantRow,
  distanceKm: number | null = null,
  isMe = false
) {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    seatsAvailable: row.seats_available,
    outboundIsOffice: row.outbound_is_office,
    outboundLabel: row.outbound_label,
    outboundLat: row.outbound_lat,
    outboundLng: row.outbound_lng,
    returnLabel: row.return_label,
    returnLat: row.return_lat,
    returnLng: row.return_lng,
    partyProfile: row.party_profile,
    notes: row.notes,
    distanceKm,
    isMe,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const participantsRoutes = new Hono();

participantsRoutes.use('*', accessCodeMiddleware);

participantsRoutes.get('/', async (c) => {
  const direction = c.req.query('direction') === 'return' ? 'return' : 'outbound';
  const myId = c.req.query('myId');
  const roleFilter = c.req.query('role');
  const onlyWithSeats = c.req.query('onlyWithSeats') === 'true';
  const noDrinkOnly = c.req.query('noDrinkOnly') === 'true';

  const queryLat = c.req.query('lat');
  const queryLng = c.req.query('lng');

  const rows = await sql<ParticipantRow[]>`
    SELECT *
    FROM participants
    ORDER BY updated_at DESC
  `;

  let meRow: ParticipantRow | undefined;
  if (myId && UUID_REGEX.test(myId)) {
    meRow = rows.find((row) => row.id === myId);
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

  const filtered = rows.filter((row) => {
    if (roleFilter && ['offer', 'need', 'split'].includes(roleFilter)) {
      if (row.role !== roleFilter) return false;
    }
    if (onlyWithSeats) {
      if (row.role !== 'offer' || row.seats_available <= 0) return false;
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

    return serializePublicParticipant(row, distanceKm, isMe);
  });

  mapped.sort((a, b) => {
    const distA = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const distB = b.distanceKm ?? Number.POSITIVE_INFINITY;
    if (distA !== distB) return distA - distB;
    if (b.seatsAvailable !== a.seatsAvailable) {
      return b.seatsAvailable - a.seatsAvailable;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const stats = {
    totalParticipants: rows.length,
    driversOffering: rows.filter((r) => r.role === 'offer').length,
    totalSeatsOpen: rows.reduce(
      (sum, r) => sum + (r.role === 'offer' ? r.seats_available : 0),
      0
    ),
    needingRide: rows.filter((r) => r.role === 'need').length,
    splittingApp: rows.filter((r) => r.role === 'split').length,
  };

  return c.json({
    direction,
    referenceSource,
    me: meRow ? serializePublicParticipant(meRow, 0, true) : null,
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
        outbound_is_office,
        outbound_label,
        outbound_lat,
        outbound_lng,
        return_label,
        return_lat,
        return_lng,
        party_profile,
        notes
      )
      VALUES (
        ${d.fullName},
        ${d.phone},
        ${d.role},
        ${d.seatsAvailable},
        ${d.outboundIsOffice},
        ${d.outboundLabel},
        ${d.outboundLat},
        ${d.outboundLng},
        ${d.returnLabel},
        ${d.returnLat},
        ${d.returnLng},
        ${d.partyProfile},
        ${d.notes}
      )
      RETURNING *
    `;

    return c.json(
      {
        participant: serializePublicParticipant(created, 0, true),
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
            'Ja existe um cadastro com este WhatsApp. Use a opcao "Recuperar meu cadastro" para editar seus dados.',
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
    participant: serializePublicParticipant(found, 0, true),
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
        outbound_is_office = ${d.outboundIsOffice},
        outbound_label = ${d.outboundLabel},
        outbound_lat = ${d.outboundLat},
        outbound_lng = ${d.outboundLng},
        return_label = ${d.returnLabel},
        return_lat = ${d.returnLat},
        return_lng = ${d.returnLng},
        party_profile = ${d.partyProfile},
        notes = ${d.notes},
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
      participant: serializePublicParticipant(updated, 0, true),
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

  if (!Number.isInteger(seats) || seats < 0 || seats > 15) {
    return c.json(
      { error: 'Informe uma quantidade valida de vagas (0 a 15).' },
      400
    );
  }

  const [updated] = await sql<ParticipantRow[]>`
    UPDATE participants
    SET
      seats_available = ${seats},
      updated_at = NOW()
    WHERE id = ${id} AND edit_token = ${editToken} AND role = 'offer'
    RETURNING *
  `;

  if (!updated) {
    return c.json(
      { error: 'Cadastro de motorista nao encontrado ou token invalido.' },
      404
    );
  }

  return c.json({
    participant: serializePublicParticipant(updated, 0, true),
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
