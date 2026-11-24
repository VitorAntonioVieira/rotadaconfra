import { config } from '../config';

export type ParticipantRole = 'offer' | 'need' | 'split';
export type PartyProfile = 'no_drink' | 'will_drink' | 'no_preference';

export interface ValidatedParticipantInput {
  fullName: string;
  phone: string;
  role: ParticipantRole;
  seatsAvailable: number;
  outboundIsOffice: boolean;
  outboundLabel: string;
  outboundLat: number | null;
  outboundLng: number | null;
  returnLabel: string;
  returnLat: number | null;
  returnLng: number | null;
  partyProfile: PartyProfile;
  notes: string;
}

const VALID_ROLES = new Set<ParticipantRole>(['offer', 'need', 'split']);
const VALID_PARTY_PROFILES = new Set<PartyProfile>([
  'no_drink',
  'will_drink',
  'no_preference',
]);

export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  return digits;
}

function parseCoordinate(
  value: unknown,
  min: number,
  max: number
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    return null;
  }
  return num;
}

export function validateParticipantInput(
  body: unknown
): { ok: true; data: ValidatedParticipantInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Dados invalidos.' };
  }

  const input = body as Record<string, unknown>;

  const fullName =
    typeof input.fullName === 'string' ? input.fullName.trim() : '';
  if (fullName.length < 2 || fullName.length > 120) {
    return {
      ok: false,
      error: 'Informe seu nome completo (entre 2 e 120 caracteres).',
    };
  }

  const rawPhone = typeof input.phone === 'string' ? input.phone : '';
  const phone = normalizePhone(rawPhone);
  if (phone.length < 10 || phone.length > 11) {
    return {
      ok: false,
      error: 'Informe um numero de WhatsApp valido com DDD.',
    };
  }

  const role = input.role as ParticipantRole;
  if (!VALID_ROLES.has(role)) {
    return { ok: false, error: 'Selecione um papel valido.' };
  }

  let seatsAvailable = 0;
  if (role === 'offer') {
    const parsedSeats = Number(input.seatsAvailable);
    if (
      !Number.isInteger(parsedSeats) ||
      parsedSeats < 0 ||
      parsedSeats > 15
    ) {
      return {
        ok: false,
        error: 'Informe uma quantidade valida de vagas (0 a 15).',
      };
    }
    seatsAvailable = parsedSeats;
  }

  const outboundIsOffice = Boolean(input.outboundIsOffice);
  let outboundLabel =
    typeof input.outboundLabel === 'string' ? input.outboundLabel.trim() : '';
  let outboundLat = parseCoordinate(input.outboundLat, -90, 90);
  let outboundLng = parseCoordinate(input.outboundLng, -180, 180);

  if (outboundIsOffice) {
    outboundLabel = config.spsOffice.label;
    outboundLat = config.spsOffice.lat;
    outboundLng = config.spsOffice.lng;
  }

  if (outboundLabel.length < 2 || outboundLabel.length > 200) {
    return {
      ok: false,
      error: 'Informe o local de saida na ida.',
    };
  }

  const returnLabel =
    typeof input.returnLabel === 'string' ? input.returnLabel.trim() : '';
  if (returnLabel.length < 2 || returnLabel.length > 200) {
    return {
      ok: false,
      error: 'Informe o bairro ou cidade de destino na volta.',
    };
  }

  const returnLat = parseCoordinate(input.returnLat, -90, 90);
  const returnLng = parseCoordinate(input.returnLng, -180, 180);

  const partyProfile = input.partyProfile as PartyProfile;
  if (!VALID_PARTY_PROFILES.has(partyProfile)) {
    return { ok: false, error: 'Selecione um perfil valido para a festa.' };
  }

  const notes =
    typeof input.notes === 'string' ? input.notes.trim().slice(0, 200) : '';

  return {
    ok: true,
    data: {
      fullName,
      phone,
      role,
      seatsAvailable,
      outboundIsOffice,
      outboundLabel,
      outboundLat,
      outboundLng,
      returnLabel,
      returnLat,
      returnLng,
      partyProfile,
      notes,
    },
  };
}
