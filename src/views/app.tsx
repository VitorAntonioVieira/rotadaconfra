import { Layout } from './layout';

export function AppPage() {
  return (
    <Layout>
      {/* Tela de Codigo de Acesso */}
      <div id="gate-screen" class="gate-screen hidden">
        <div class="gate-card">
          <div class="gate-brand">
            <div class="brand-badge" aria-hidden="true">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
            <div>
              <h1 class="gate-title">Rota da Confra</h1>
              <p class="gate-subtitle">Confraternização SPS Group</p>
            </div>
          </div>

          <div class="event-summary-box">
            <div class="event-summary-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Espaço Lagoon</span>
            </div>
            <div class="event-summary-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>12h30 às 18h (saída do expediente às 12h)</span>
            </div>
          </div>

          <form id="gate-form" class="gate-form" novalidate>
            <label class="field-label" for="access-code-input">
              Código de acesso da empresa
            </label>
            <div class="input-with-icon">
              <svg
                class="input-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="access-code-input"
                type="password"
                class="text-input has-icon"
                placeholder="Digite o código de acesso"
                autocomplete="off"
                required
              />
            </div>
            <p id="gate-error" class="form-error hidden"></p>
            <button id="gate-submit-btn" type="submit" class="btn btn-primary btn-full">
              Acessar caronas
            </button>
          </form>
        </div>
      </div>

      {/* Aplicacao Principal */}
      <div id="main-app" class="app-shell hidden">
        <header class="app-header">
          <div class="container header-inner">
            <div class="header-top">
              <div class="header-brand">
                <div class="header-logo" aria-hidden="true">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <div>
                  <h1 class="header-title">Rota da Confra</h1>
                  <p class="header-subtitle">Confraternização SPS Group</p>
                </div>
              </div>
              <button
                id="header-profile-btn"
                type="button"
                class="btn btn-header-action"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span id="header-profile-btn-label">Meu cadastro</span>
              </button>
            </div>

            <div class="event-strip">
              <span class="event-pill">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Espaço Lagoon
              </span>
              <span class="event-pill">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                12h30 às 18h
              </span>
              <span class="event-pill">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
                Saída às 12h
              </span>
            </div>
          </div>
        </header>

        <main class="container main-content">
          {/* Card de Status / CTA do Proprio Cadastro */}
          <section id="my-status-card" class="my-status-card"></section>

          {/* Resumo Numerico */}
          <section id="stats-row" class="stats-row" aria-label="Resumo de caronas"></section>

          {/* Navegacao Principal: Ida, Volta e Minhas Caronas */}
          <section class="controls-card">
            <div class="direction-tabs tabs-three" role="tablist" aria-label="Seções">
              <button
                type="button"
                role="tab"
                id="tab-outbound"
                class="tab-btn active"
                data-tab="outbound"
                aria-selected="true"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                <span>Ida</span>
              </button>
              <button
                type="button"
                role="tab"
                id="tab-return"
                class="tab-btn"
                data-tab="return"
                aria-selected="false"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="m12 19-7-7 7-7" />
                </svg>
                <span>Volta</span>
              </button>
              <button
                type="button"
                role="tab"
                id="tab-mine"
                class="tab-btn"
                data-tab="mine"
                aria-selected="false"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Minhas Caronas</span>
                <span id="pending-badge" class="tab-badge hidden">0</span>
              </button>
            </div>

            <div id="list-filters-wrap" class="filter-group">
              <div class="filter-chips" role="group" aria-label="Filtrar por papel">
                <button type="button" class="chip active" data-role-filter="">
                  Todos
                </button>
                <button type="button" class="chip" data-role-filter="offer">
                  Oferece carona
                </button>
                <button type="button" class="chip" data-role-filter="need">
                  Precisa de carona
                </button>
                <button type="button" class="chip" data-role-filter="split">
                  Dividir app
                </button>
              </div>

              <div class="quick-toggles">
                <button type="button" id="filter-only-seats" class="toggle-chip">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" x2="19" y1="8" y2="14" />
                    <line x1="22" x2="16" y1="11" y2="11" />
                  </svg>
                  <span>Apenas com vagas</span>
                </button>
                <button type="button" id="filter-no-drink" class="toggle-chip">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Não vai beber</span>
                </button>
              </div>

              <p id="reference-caption" class="reference-caption"></p>
            </div>
          </section>

          {/* Lista de Participantes (Ida / Volta) */}
          <section id="participants-list" class="participants-list" aria-live="polite"></section>

          {/* Painel Minhas Caronas */}
          <section id="my-rides-panel" class="my-rides-panel hidden" aria-live="polite"></section>
        </main>
      </div>

      {/* Tela em Stack de Cadastro e Edicao */}
      <div
        id="profile-stack-screen"
        class="stack-screen hidden"
        role="region"
        aria-labelledby="stack-title"
        aria-hidden="true"
      >
        <header class="stack-header">
          <div class="container stack-header-inner">
            <button
              id="stack-back-btn"
              type="button"
              class="stack-back-btn"
              aria-label="Voltar para a tela inicial"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              <span>Voltar</span>
            </button>
            <div class="stack-header-titles">
              <h2 id="stack-title" class="stack-title">Cadastrar minha rota</h2>
              <p id="stack-subtitle" class="stack-subtitle">
                Informe apenas bairro ou cidade para manter sua privacidade.
              </p>
            </div>
          </div>
        </header>

        <div class="container stack-content">
          <div class="stack-card">
            <div id="stack-mode-switch" class="mode-switch">
              <button type="button" id="mode-new-btn" class="mode-btn active">
                Novo cadastro
              </button>
              <button type="button" id="mode-recover-btn" class="mode-btn">
                Já tenho cadastro
              </button>
            </div>

            {/* Formulario de Recuperacao por Telefone */}
            <form id="recover-form" class="modal-form hidden" novalidate>
              <div class="form-field">
                <label class="field-label" for="recover-phone-input">
                  WhatsApp cadastrado
                </label>
                <input
                  id="recover-phone-input"
                  type="tel"
                  class="text-input"
                  placeholder="(12) 99999-9999"
                  inputmode="tel"
                  required
                />
                <span class="field-hint">
                  Informe o número utilizado no seu cadastro para editar seus dados ou gerenciar caronas.
                </span>
              </div>
              <p id="recover-error" class="form-error hidden"></p>
              <button id="recover-submit-btn" type="submit" class="btn btn-primary btn-full">
                Encontrar meu cadastro
              </button>
            </form>

            {/* Formulario Principal do Participante */}
            <form id="profile-form" class="modal-form" novalidate>
              <div class="form-field">
                <label class="field-label" for="input-full-name">
                  Nome completo
                </label>
                <input
                  id="input-full-name"
                  type="text"
                  class="text-input"
                  placeholder="Ex: Mariana Oliveira"
                  maxlength={120}
                  required
                />
              </div>

              <div class="form-field">
                <label class="field-label" for="input-phone">
                  Telefone / WhatsApp
                </label>
                <input
                  id="input-phone"
                  type="tel"
                  class="text-input"
                  placeholder="(12) 99999-9999"
                  inputmode="tel"
                  maxlength={16}
                  required
                />
              </div>

              {/* Perfil na festa */}
              <div class="form-field">
                <span class="field-label">Perfil na festa</span>
                <div class="option-grid">
                  <label class="option-card">
                    <input type="radio" name="partyProfile" value="no_drink" />
                    <span class="option-card-body">
                      <span class="option-card-title">Não vou beber (motorista)</span>
                    </span>
                  </label>
                  <label class="option-card">
                    <input type="radio" name="partyProfile" value="will_drink" />
                    <span class="option-card-body">
                      <span class="option-card-title">Vou beber na festa</span>
                      <span class="option-card-desc">Você pode oferecer carona na ida e voltar de carona ou app</span>
                    </span>
                  </label>
                  <label class="option-card">
                    <input type="radio" name="partyProfile" value="no_preference" checked />
                    <span class="option-card-body">
                      <span class="option-card-title">Sem preferência</span>
                    </span>
                  </label>
                </div>
                <p id="drink-helper-note" class="info-callout hidden">
                  Como você vai beber, a volta foi configurada separadamente da ida. Ajuste abaixo se preferir.
                </p>
              </div>

              {/* Selecao de Trechos */}
              <div class="form-field">
                <span class="field-label">Quais trechos você quer organizar?</span>
                <div class="scope-grid">
                  <label class="scope-option">
                    <input type="radio" name="tripScope" value="both" checked />
                    <span>Ida e volta</span>
                  </label>
                  <label class="scope-option">
                    <input type="radio" name="tripScope" value="outbound_only" />
                    <span>Apenas ida</span>
                  </label>
                  <label class="scope-option">
                    <input type="radio" name="tripScope" value="return_only" />
                    <span>Apenas volta</span>
                  </label>
                </div>
              </div>

              {/* Secao IDA */}
              <div id="outbound-section" class="segment-box">
                <div class="segment-box-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                  <span>Trajeto de Ida (para o Espaço Lagoon)</span>
                </div>

                <div class="form-field">
                  <span class="field-label">Como você participa na ida?</span>
                  <div class="option-grid">
                    <label class="option-card">
                      <input type="radio" name="outboundRole" value="offer" checked />
                      <span class="option-card-body">
                        <span class="option-card-title">Ofereço carona</span>
                        <span class="option-card-desc">Tenho carro com vagas na ida</span>
                      </span>
                    </label>
                    <label class="option-card">
                      <input type="radio" name="outboundRole" value="need" />
                      <span class="option-card-body">
                        <span class="option-card-title">Preciso de carona</span>
                        <span class="option-card-desc">Procuro lugar em um carro na ida</span>
                      </span>
                    </label>
                    <label class="option-card">
                      <input type="radio" name="outboundRole" value="split" />
                      <span class="option-card-body">
                        <span class="option-card-title">Quero dividir carro de app</span>
                        <span class="option-card-desc">Compartilhar Uber ou 99 na ida</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div id="outbound-seats-field" class="form-field">
                  <label class="field-label" for="input-seats-ida">
                    Vagas disponíveis na ida
                  </label>
                  <div class="stepper">
                    <button type="button" id="seats-ida-dec" class="stepper-btn" aria-label="Diminuir vagas na ida">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                    <input
                      id="input-seats-ida"
                      type="number"
                      min={0}
                      max={15}
                      value={3}
                      class="stepper-input"
                    />
                    <button type="button" id="seats-ida-inc" class="stepper-btn" aria-label="Aumentar vagas na ida">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="form-field">
                  <div class="field-label-row">
                    <label class="field-label" for="input-outbound">
                      Local de saída (ida)
                    </label>
                    <button type="button" id="btn-office-quick" class="quick-link-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                        <path d="M9 22v-4h6v4" />
                      </svg>
                      <span>Escritório SPS</span>
                    </button>
                  </div>
                  <div class="autocomplete-wrap">
                    <input
                      id="input-outbound"
                      type="text"
                      class="text-input"
                      placeholder="Digite bairro e cidade (ex: Jardim Aquarius, SJC)"
                      autocomplete="off"
                    />
                    <div id="outbound-suggestions" class="suggestions-list hidden"></div>
                  </div>
                  <span id="outbound-geo-status" class="geo-status"></span>
                </div>
              </div>

              {/* Secao VOLTA */}
              <div id="return-section" class="segment-box">
                <div class="segment-box-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                  </svg>
                  <span>Trajeto de Volta (saindo do Espaço Lagoon)</span>
                </div>

                <div class="form-field">
                  <span class="field-label">Como você participa na volta?</span>
                  <div class="option-grid">
                    <label class="option-card">
                      <input type="radio" name="returnRole" value="offer" checked />
                      <span class="option-card-body">
                        <span class="option-card-title">Ofereço carona</span>
                        <span class="option-card-desc">Tenho carro com vagas na volta</span>
                      </span>
                    </label>
                    <label class="option-card">
                      <input type="radio" name="returnRole" value="need" />
                      <span class="option-card-body">
                        <span class="option-card-title">Preciso de carona</span>
                        <span class="option-card-desc">Procuro lugar em um carro na volta</span>
                      </span>
                    </label>
                    <label class="option-card">
                      <input type="radio" name="returnRole" value="split" />
                      <span class="option-card-body">
                        <span class="option-card-title">Quero dividir carro de app</span>
                        <span class="option-card-desc">Compartilhar Uber ou 99 na volta</span>
                      </span>
                    </label>
                    <label id="return-role-none-option" class="option-card">
                      <input type="radio" name="returnRole" value="none" />
                      <span class="option-card-body">
                        <span class="option-card-title">Não preciso (volto de app por conta própria)</span>
                        <span class="option-card-desc">Não aparecer na listagem de volta</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div id="return-seats-field" class="form-field">
                  <label class="field-label" for="input-seats-volta">
                    Vagas disponíveis na volta
                  </label>
                  <div class="stepper">
                    <button type="button" id="seats-volta-dec" class="stepper-btn" aria-label="Diminuir vagas na volta">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                    <input
                      id="input-seats-volta"
                      type="number"
                      min={0}
                      max={15}
                      value={3}
                      class="stepper-input"
                    />
                    <button type="button" id="seats-volta-inc" class="stepper-btn" aria-label="Aumentar vagas na volta">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div id="return-location-field" class="form-field">
                  <label class="field-label" for="input-return">
                    Local de destino (volta)
                  </label>
                  <div class="autocomplete-wrap">
                    <input
                      id="input-return"
                      type="text"
                      class="text-input"
                      placeholder="Digite bairro e cidade de destino"
                      autocomplete="off"
                    />
                    <div id="return-suggestions" class="suggestions-list hidden"></div>
                  </div>
                  <span id="return-geo-status" class="geo-status"></span>
                </div>
              </div>

              {/* Observacao */}
              <div class="form-field">
                <label class="field-label" for="input-notes">
                  Observação curta (opcional)
                </label>
                <input
                  id="input-notes"
                  type="text"
                  class="text-input"
                  placeholder="Ex: Saio às 12h15, passo pela Dutra"
                  maxlength={160}
                />
              </div>

              <p id="profile-error" class="form-error hidden"></p>

              <div class="modal-actions">
                <button id="profile-submit-btn" type="submit" class="btn btn-primary btn-full">
                  Salvar cadastro
                </button>
                <button
                  id="profile-delete-btn"
                  type="button"
                  class="btn btn-danger-ghost btn-full hidden"
                >
                  Remover meu cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div id="toast" class="toast hidden" role="status" aria-live="polite"></div>
    </Layout>
  );
}
