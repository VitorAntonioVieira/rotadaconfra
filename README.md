# Rota da Confra — Confraternização SPS Group

Aplicação web responsiva (mobile-first) para organização de caronas entre colaboradores da SPS Group para a confraternização no **Espaço Lagoon** (12h30 às 18h, com saída do expediente às 12h).

## Stack

- **Backend:** Bun + Hono (TypeScript)
- **Banco de Dados:** PostgreSQL 16 (com criação automática de tabelas e índices na inicialização)
- **Frontend:** Hono JSX + CSS puro (identidade visual SPS Group) + JavaScript leve com ícones SVG minimalistas
- **Geolocalização:** OpenStreetMap Nominatim (gratuito, com debounce e proxy/cache no backend)
- **Infraestrutura:** Docker + Docker Compose

## Como executar com Docker

1. Opcionalmente, copie `.env.example` para `.env` e ajuste as variáveis conforme necessário:

```bash
cp .env.example .env
```

2. Suba a aplicação e o PostgreSQL:

```bash
docker compose up --build
```

3. Acesse no navegador:

```
http://localhost:3000
```

O código de acesso padrão é `confra2026` (configurável via `ACCESS_CODE`).

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP da aplicação |
| `DATABASE_URL` | `postgres://rota:rota_secret@db:5432/rota_da_confra` | String de conexão do PostgreSQL |
| `ACCESS_CODE` | `confra2026` | Código de acesso único para colaboradores |
| `SPS_OFFICE_LABEL` | `Escritório SPS (Jardim Limoeiro, São José dos Campos - SP)` | Rótulo da opção rápida de saída |
| `SPS_OFFICE_LAT` | `-23.2370` | Latitude aproximada do escritório |
| `SPS_OFFICE_LNG` | `-45.9087` | Longitude aproximada do escritório |

## Estrutura de Pastas

```text
.
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                  # Inicialização do servidor Bun + Hono
    ├── config.ts                 # Leitura de variáveis de ambiente
    ├── db/
    │   ├── client.ts             # Conexão PostgreSQL com retry na inicialização
    │   └── schema.ts             # Criação automática da tabela participants e índices
    ├── lib/
    │   ├── haversine.ts          # Cálculo de distância em km (fórmula de Haversine)
    │   ├── nominatim.ts          # Busca aproximada de bairro/cidade com cache
    │   └── validation.ts         # Validação e normalização de entrada
    ├── middleware/
    │   └── accessCode.ts         # Validação do header X-Access-Code
    ├── routes/
    │   ├── auth.ts               # Verificação do código de acesso e config
    │   ├── geocode.ts            # Endpoint de busca de localização
    │   └── participants.ts       # CRUD, recuperação por telefone, vagas e ordenação por distância
    ├── views/
    │   ├── layout.tsx            # Template HTML base
    │   └── app.tsx               # Interface principal e modal de cadastro
    └── public/
        ├── styles.css            # Estilos mobile-first com paleta SPS Group
        └── app.js                # Lógica de interface, máscara de telefone e autocomplete
```
