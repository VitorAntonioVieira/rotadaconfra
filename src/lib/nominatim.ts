export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  state?: string;
  'ISO3166-2-lvl4'?: string;
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const cache = new Map<string, { expiresAt: number; results: GeocodeResult[] }>();

function extractStateCode(address?: NominatimAddress): string {
  const iso = address?.['ISO3166-2-lvl4'];
  if (iso && iso.includes('-')) {
    return iso.split('-')[1] ?? '';
  }
  return address?.state ?? '';
}

function formatApproximateLabel(item: NominatimItem): string {
  const addr = item.address;
  if (!addr) {
    return item.display_name.split(',').slice(0, 2).join(',').trim();
  }

  const neighborhood =
    addr.suburb ||
    addr.neighbourhood ||
    addr.quarter ||
    addr.city_district ||
    addr.village;

  const city = addr.city || addr.town || addr.municipality;
  const state = extractStateCode(addr);

  const parts: string[] = [];
  if (neighborhood) {
    parts.push(neighborhood);
  }
  if (city && city !== neighborhood) {
    parts.push(city);
  }

  let base = parts.join(', ');
  if (!base) {
    base = item.display_name.split(',').slice(0, 2).join(',').trim();
  }

  return state ? `${base} - ${state}` : base;
}

export async function searchLocations(rawQuery: string): Promise<GeocodeResult[]> {
  const query = rawQuery.trim();
  if (query.length < 3) {
    return [];
  }

  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'br',
    limit: '6',
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        'User-Agent': 'RotaDaConfra-SPSGroup/1.0 (carona-corporativa)',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Nominatim retornou status ${response.status}`);
  }

  const items = (await response.json()) as NominatimItem[];
  const seen = new Set<string>();
  const results: GeocodeResult[] = [];

  for (const item of items) {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const label = formatApproximateLabel(item);
    const key = label.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push({
      label,
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
    });
  }

  if (cache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }

  cache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    results,
  });

  return results;
}
