import { config } from '../config';

export type TripScope = 'both' | 'outbound_only' | 'return_only';
export type SegmentRole = 'offer' | 'need' | 'split' | 'none';
export type LegacyRole = 'offer' | 'need' | 'split';
export type PartyProfile = 'no_drink' | 'will_drink' | 'no_preference';

export interface ValidatedParticipantInput {
  fullName: string;
  phone: string;
  tripScope: TripScope;
  role: LegacyRole;
  seatsAvailable: number;
  outboundRole: SegmentRole;
  returnRole: SegmentRole;
  vagasIda: number;
  vagasVolta: number;
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

const VALID_SCOPES = new Set<TripScope>([
  'both',
  'outbound_only',
  'return_only',
]);
const VALID_ACTIVE_ROLES = new Set<LegacyRole>(['offer', 'need', 'split']);
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

function parseSeats(value: unknown, label: string): { ok: true; value: number } | { ok: false; error: string } {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 15) {
    return {
      ok: false,
      error: `Informe uma quantidade valida de vagas para ${label} (0 a 15).`,
    };
  }
  return { ok: true, value: parsed };
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

  const tripScope = (
    typeof input.tripScope === 'string' ? input.tripScope : 'both'
  ) as TripScope;
  if (!VALID_SCOPES.has(tripScope)) {
    return { ok: false, error: 'Selecione um tipo de trajeto valido.' };
  }

  const hasOutbound = tripScope === 'both' || tripScope === 'outbound_only';
  const hasReturn = tripScope === 'both' || tripScope === 'return_only';

  // Papel por trecho (com fallback para campo legado "role")
  const fallbackRole = VALID_ACTIVE_ROLES.has(input.role as LegacyRole)
    ? (input.role as LegacyRole)
    : 'need';

  let outboundRole: SegmentRole = 'none';
  let returnRole: SegmentRole = 'none';

  if (hasOutbound) {
    const candidate = (input.outboundRole ?? fallbackRole) as LegacyRole;
    if (!VALID_ACTIVE_ROLES.has(candidate)) {
      return { ok: false, error: 'Selecione como voce participa na ida.' };
    }
    outboundRole = candidate;
  }

  if (hasReturn) {
    const candidate = (input.returnRole ?? fallbackRole) as SegmentRole;
    if (candidate === 'none') {
      returnRole = 'none';
    } else if (!VALID_ACTIVE_ROLES.has(candidate as LegacyRole)) {
      return { ok: false, error: 'Selecione como voce participa na volta.' };
    } else {
      returnRole = candidate;
    }
  }

  // Se o usuario marcou "both" mas na volta escolheu "none" (ex: volto de app por conta propria), ajusta tripScope
  const effectiveScope: TripScope =
    outboundRole !== 'none' && returnRole !== 'none'
      ? 'both'
      : outboundRole !== 'none'
        ? 'outbound_only'
        : 'return_only';

  if (outboundRole === 'none' && returnRole === 'none') {
    return {
      ok: false,
      error: 'Selecione ao menos um trecho (ida ou volta) para participar.',
    };
  }

  let vagasIda = 0;
  if (outboundRole === 'offer') {
    const res = parseSeats(input.vagasIda ?? input.seatsAvailable ?? 3, 'a ida');
    if (!res.ok) return res;
    vagasIda = res.value;
  }

  let vagasVolta = 0;
  if (returnRole === 'offer') {
    const res = parseSeats(input.vagasVolta ?? input.seatsAvailable ?? 3, 'a volta');
    if (!res.ok) return res;
    vagasVolta = res.value;
  }

  // Localizacao da ida
  let outboundIsOffice = false;
  let outboundLabel = '';
  let outboundLat: number | null = null;
  let outboundLng: number | null = null;

  if (outboundRole !== 'none') {
    outboundIsOffice = Boolean(input.outboundIsOffice);
    outboundLabel =
      typeof input.outboundLabel === 'string' ? input.outboundLabel.trim() : '';
    outboundLat = parseCoordinate(input.outboundLat, -90, 90);
    outboundLng = parseCoordinate(input.outboundLng, -180, 180);

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
  }

  // Localizacao da volta
  let returnLabel = '';
  let returnLat: number | null = null;
  let returnLng: number | null = null;

  if (returnRole !== 'none') {
    returnLabel =
      typeof input.returnLabel === 'string' ? input.returnLabel.trim() : '';
    if (returnLabel.length < 2 || returnLabel.length > 200) {
      return {
        ok: false,
        error: 'Informe o bairro ou cidade de destino na volta.',
      };
    }
    returnLat = parseCoordinate(input.returnLat, -90, 90);
    returnLng = parseCoordinate(input.returnLng, -180, 180);
  }

  const partyProfile = input.partyProfile as PartyProfile;
  if (!VALID_PARTY_PROFILES.has(partyProfile)) {
    return { ok: false, error: 'Selecione um perfil valido para a festa.' };
  }

  const notes =
    typeof input.notes === 'string' ? input.notes.trim().slice(0, 200) : '';

  // Campos legados sincronizados para compatibilidade
  const legacyRole: LegacyRole =
    outboundRole === 'offer' || returnRole === 'offer'
      ? 'offer'
      : outboundRole !== 'none'
        ? outboundRole
        : (returnRole as LegacyRole);
  const legacySeats = Math.max(vagasIda, vagasVolta);

  return {
    ok: true,
    data: {
      fullName,
      phone,
      tripScope: effectiveScope,
      role: legacyRole,
      seatsAvailable: legacySeats,
      outboundRole,
      returnRole,
      vagasIda,
      vagasVolta,
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
