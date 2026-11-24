export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://rota:rota_secret@localhost:5432/rota_da_confra',
  accessCode: (process.env.ACCESS_CODE ?? 'confra2026').trim(),
  spsOffice: {
    label:
      process.env.SPS_OFFICE_LABEL ??
      'Escritório SPS (Jardim Limoeiro, São José dos Campos - SP)',
    lat: Number(process.env.SPS_OFFICE_LAT ?? -23.237),
    lng: Number(process.env.SPS_OFFICE_LNG ?? -45.9087),
  },
} as const;
