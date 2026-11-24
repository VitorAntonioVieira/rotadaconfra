(() => {
  'use strict';

  const STORAGE_KEYS = {
    accessCode: 'rota_confra_access_code',
    participantId: 'rota_confra_participant_id',
    editToken: 'rota_confra_edit_token',
  };

  const POLL_INTERVAL_MS = 10000;

  const state = {
    accessCode: localStorage.getItem(STORAGE_KEYS.accessCode) || '',
    myId: localStorage.getItem(STORAGE_KEYS.participantId) || '',
    editToken: localStorage.getItem(STORAGE_KEYS.editToken) || '',
    spsOffice: {
      label: 'Escritório SPS (Jardim Limoeiro, São José dos Campos - SP)',
      lat: -23.237,
      lng: -45.9087,
    },
    activeTab: 'outbound', // 'outbound' | 'return' | 'mine'
    roleFilter: '',
    onlyWithSeats: false,
    noDrinkOnly: false,
    me: null,
    participants: [],
    stats: null,
    referenceSource: 'none',
    pendingReceivedCount: 0,
    myRides: null,
    isEditing: false,
    modalOpen: false,
    outboundGeo: { isOffice: false, label: '', lat: null, lng: null },
    returnGeo: { label: '', lat: null, lng: null },
  };

  const ROLE_LABELS = {
    offer: 'Oferece carona',
    need: 'Precisa de carona',
    split: 'Dividir app',
    none: 'Não participa',
  };

  const PARTY_LABELS = {
    no_drink: 'Não vai beber (motorista)',
    will_drink: 'Vou beber na festa',
    no_preference: 'Sem preferência',
  };

  const ICONS = {
    mapPin:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    navigation:
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    message:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    check:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    x:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    edit:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    plus:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    search:
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    users:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    send:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    clock:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    car:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
  };

  // DOM References
  const el = {
    gateScreen: document.getElementById('gate-screen'),
    gateForm: document.getElementById('gate-form'),
    accessCodeInput: document.getElementById('access-code-input'),
    gateError: document.getElementById('gate-error'),
    gateSubmitBtn: document.getElementById('gate-submit-btn'),

    mainApp: document.getElementById('main-app'),
    headerProfileBtn: document.getElementById('header-profile-btn'),
    headerProfileBtnLabel: document.getElementById('header-profile-btn-label'),
    myStatusCard: document.getElementById('my-status-card'),
    statsRow: document.getElementById('stats-row'),
    listFiltersWrap: document.getElementById('list-filters-wrap'),
    referenceCaption: document.getElementById('reference-caption'),
    participantsList: document.getElementById('participants-list'),
    myRidesPanel: document.getElementById('my-rides-panel'),

    tabOutbound: document.getElementById('tab-outbound'),
    tabReturn: document.getElementById('tab-return'),
    tabMine: document.getElementById('tab-mine'),
    pendingBadge: document.getElementById('pending-badge'),

    roleFilterBtns: Array.from(document.querySelectorAll('[data-role-filter]')),
    filterOnlySeats: document.getElementById('filter-only-seats'),
    filterNoDrink: document.getElementById('filter-no-drink'),

    profileModal: document.getElementById('profile-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalSubtitle: document.getElementById('modal-subtitle'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalModeSwitch: document.getElementById('modal-mode-switch'),
    modeNewBtn: document.getElementById('mode-new-btn'),
    modeRecoverBtn: document.getElementById('mode-recover-btn'),

    recoverForm: document.getElementById('recover-form'),
    recoverPhoneInput: document.getElementById('recover-phone-input'),
    recoverError: document.getElementById('recover-error'),
    recoverSubmitBtn: document.getElementById('recover-submit-btn'),

    profileForm: document.getElementById('profile-form'),
    inputFullName: document.getElementById('input-full-name'),
    inputPhone: document.getElementById('input-phone'),
    drinkHelperNote: document.getElementById('drink-helper-note'),

    outboundSection: document.getElementById('outbound-section'),
    outboundSeatsField: document.getElementById('outbound-seats-field'),
    inputSeatsIda: document.getElementById('input-seats-ida'),
    seatsIdaDec: document.getElementById('seats-ida-dec'),
    seatsIdaInc: document.getElementById('seats-ida-inc'),
    btnOfficeQuick: document.getElementById('btn-office-quick'),
    inputOutbound: document.getElementById('input-outbound'),
    outboundSuggestions: document.getElementById('outbound-suggestions'),
    outboundGeoStatus: document.getElementById('outbound-geo-status'),

    returnSection: document.getElementById('return-section'),
    returnRoleNoneOption: document.getElementById('return-role-none-option'),
    returnSeatsField: document.getElementById('return-seats-field'),
    returnLocationField: document.getElementById('return-location-field'),
    inputSeatsVolta: document.getElementById('input-seats-volta'),
    seatsVoltaDec: document.getElementById('seats-volta-dec'),
    seatsVoltaInc: document.getElementById('seats-volta-inc'),
    inputReturn: document.getElementById('input-return'),
    returnSuggestions: document.getElementById('return-suggestions'),
    returnGeoStatus: document.getElementById('return-geo-status'),

    inputNotes: document.getElementById('input-notes'),
    profileError: document.getElementById('profile-error'),
    profileSubmitBtn: document.getElementById('profile-submit-btn'),
    profileDeleteBtn: document.getElementById('profile-delete-btn'),

    toast: document.getElementById('toast'),
  };

  let toastTimer = null;
  let pollTimer = null;
  let isPolling = false;

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.add('hidden');
    }, 3400);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatPhoneMask(raw) {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function formatDistance(distanceKm, isMe) {
    if (isMe) return 'Seu ponto';
    if (distanceKm === null || distanceKm === undefined) return 'Sem localização';
    if (distanceKm < 0.2) return 'Mesmo local';
    return `${distanceKm.toFixed(1).replace('.', ',')} km`;
  }

  function buildWhatsAppUrl(fullName, phone, trecho) {
    const firstName = fullName.trim().split(/\s+/)[0] || fullName;
    const tripText =
      trecho === 'ida' || trecho === 'outbound'
        ? 'na ida para o Espaço Lagoon'
        : 'na volta do Espaço Lagoon';
    const message = `Olá, ${firstName}! Vi seu cadastro no Rota da Confra (SPS Group) e gostaria de combinar carona ${tripText}.`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  }

  async function apiFetch(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (state.accessCode) {
      headers['X-Access-Code'] = state.accessCode;
    }

    const response = await fetch(path, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 && path !== '/api/auth/verify') {
      localStorage.removeItem(STORAGE_KEYS.accessCode);
      state.accessCode = '';
      stopPolling();
      showGateScreen();
      throw new Error('Sessão expirada. Informe o código de acesso novamente.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao comunicar com o servidor.');
    }

    return data;
  }

  function showGateScreen() {
    el.mainApp.classList.add('hidden');
    el.gateScreen.classList.remove('hidden');
    el.accessCodeInput.focus();
  }

  function showMainApp() {
    el.gateScreen.classList.add('hidden');
    el.mainApp.classList.remove('hidden');
  }

  function saveMySession(participant, editToken) {
    state.myId = participant.id;
    state.me = participant;
    localStorage.setItem(STORAGE_KEYS.participantId, participant.id);
    if (editToken) {
      state.editToken = editToken;
      localStorage.setItem(STORAGE_KEYS.editToken, editToken);
    }
  }

  function clearMySession() {
    state.myId = '';
    state.editToken = '';
    state.me = null;
    state.myRides = null;
    state.pendingReceivedCount = 0;
    localStorage.removeItem(STORAGE_KEYS.participantId);
    localStorage.removeItem(STORAGE_KEYS.editToken);
  }

  function updatePendingBadge() {
    if (state.pendingReceivedCount > 0) {
      el.pendingBadge.textContent = String(state.pendingReceivedCount);
      el.pendingBadge.classList.remove('hidden');
    } else {
      el.pendingBadge.classList.add('hidden');
    }
  }

  // ---------------- Data Loading & Polling ----------------
  async function loadParticipants(silent = false) {
    const direction = state.activeTab === 'return' ? 'return' : 'outbound';
    const params = new URLSearchParams({ direction });

    if (state.myId) params.set('myId', state.myId);
    if (state.roleFilter) params.set('role', state.roleFilter);
    if (state.onlyWithSeats) params.set('onlyWithSeats', 'true');
    if (state.noDrinkOnly) params.set('noDrinkOnly', 'true');

    try {
      const data = await apiFetch(`/api/participants?${params.toString()}`);
      state.participants = data.participants || [];
      state.stats = data.stats || null;
      state.referenceSource = data.referenceSource || 'none';
      state.pendingReceivedCount = Number(data.pendingReceivedCount || 0);
      state.me = data.me || null;

      if (state.myId && !state.me) {
        clearMySession();
      }

      renderAll();
    } catch (error) {
      if (!silent) showToast(error.message);
    }
  }

  async function loadMyRides(silent = false) {
    if (!state.editToken) {
      state.myRides = null;
      state.pendingReceivedCount = 0;
      renderAll();
      return;
    }

    try {
      const data = await apiFetch('/api/requests/mine', {
        headers: { 'X-Edit-Token': state.editToken },
      });
      state.myRides = data;
      state.pendingReceivedCount = Number(data.pendingCount || 0);
      renderAll();
    } catch (error) {
      if (!silent) showToast(error.message);
    }
  }

  async function refreshActiveView(silent = false) {
    if (isPolling || !state.accessCode) return;
    isPolling = true;
    try {
      if (state.activeTab === 'mine') {
        await Promise.all([loadParticipants(true), loadMyRides(silent)]);
      } else {
        await loadParticipants(silent);
      }
    } finally {
      isPolling = false;
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(() => {
      if (!document.hidden && !state.modalOpen && state.accessCode) {
        refreshActiveView(true);
      }
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // ---------------- Rendering ----------------
  function renderMyStatusCard() {
    if (!state.me) {
      el.headerProfileBtnLabel.textContent = 'Cadastrar';
      el.myStatusCard.innerHTML = `
        <div class="cta-header">
          <div>
            <h2 class="cta-title">Organize sua carona para a festa</h2>
            <p class="cta-desc">Cadastre ida, volta ou ambos para pedir caronas pelo app e ver colegas próximos.</p>
          </div>
        </div>
        <div class="cta-actions">
          <button type="button" id="cta-register-btn" class="btn btn-primary btn-sm">
            ${ICONS.plus}
            <span>Cadastrar minha rota</span>
          </button>
          <button type="button" id="cta-recover-btn" class="btn btn-secondary btn-sm">
            <span>Já tenho cadastro</span>
          </button>
        </div>
      `;

      document.getElementById('cta-register-btn').addEventListener('click', () => {
        openProfileModal('new');
      });
      document.getElementById('cta-recover-btn').addEventListener('click', () => {
        openProfileModal('recover');
      });
      return;
    }

    el.headerProfileBtnLabel.textContent = 'Editar perfil';
    const me = state.me;

    const segmentsDesc = [];
    if (me.outboundRole !== 'none') {
      segmentsDesc.push(
        `Ida: ${ROLE_LABELS[me.outboundRole]}${me.outboundRole === 'offer' ? ` (${me.remainingIda}/${me.vagasIda} livres)` : ''}`
      );
    }
    if (me.returnRole !== 'none') {
      segmentsDesc.push(
        `Volta: ${ROLE_LABELS[me.returnRole]}${me.returnRole === 'offer' ? ` (${me.remainingVolta}/${me.vagasVolta} livres)` : ''}`
      );
    }

    const pendingNotice =
      state.pendingReceivedCount > 0
        ? `<button type="button" id="quick-open-mine-btn" class="btn btn-primary btn-sm">
             ${ICONS.users}
             <span>${state.pendingReceivedCount} ${state.pendingReceivedCount === 1 ? 'solicitação pendente' : 'solicitações pendentes'}</span>
           </button>`
        : '';

    el.myStatusCard.innerHTML = `
      <div class="cta-header">
        <div>
          <h2 class="cta-title">${escapeHtml(me.fullName)}</h2>
          <p class="cta-desc">${escapeHtml(segmentsDesc.join(' | '))}</p>
        </div>
      </div>
      <div class="my-profile-meta">
        <span class="tag tag-profile">${PARTY_LABELS[me.partyProfile]}</span>
      </div>
      <div class="cta-actions">
        <button type="button" id="quick-edit-btn" class="btn btn-secondary btn-sm">
          ${ICONS.edit}
          <span>Editar dados</span>
        </button>
        ${pendingNotice}
      </div>
    `;

    document.getElementById('quick-edit-btn').addEventListener('click', () => {
      openProfileModal('edit');
    });

    const openMineBtn = document.getElementById('quick-open-mine-btn');
    if (openMineBtn) {
      openMineBtn.addEventListener('click', () => switchTab('mine'));
    }
  }

  function renderStats() {
    if (!state.stats || state.activeTab === 'mine') {
      el.statsRow.classList.add('hidden');
      return;
    }

    el.statsRow.classList.remove('hidden');
    el.statsRow.innerHTML = `
      <div class="stat-card">
        <span class="stat-value">${state.stats.totalParticipants}</span>
        <span class="stat-label">Neste trecho</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${state.stats.totalSeatsOpen}</span>
        <span class="stat-label">Vagas livres</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${state.stats.driversOffering}</span>
        <span class="stat-label">Motoristas</span>
      </div>
    `;
  }

  function renderReferenceCaption() {
    const dirLabel = state.activeTab === 'outbound' ? 'saída (Ida)' : 'destino (Volta)';
    if (state.referenceSource === 'user') {
      el.referenceCaption.innerHTML = `${ICONS.navigation} Ordenado por proximidade do seu ponto de ${dirLabel}.`;
    } else if (state.referenceSource === 'office') {
      el.referenceCaption.innerHTML = `${ICONS.navigation} Ordenado por proximidade do Escritório SPS. Cadastre sua rota para personalizar.`;
    } else {
      el.referenceCaption.innerHTML = `${ICONS.navigation} Cadastre seu destino de volta para calcular distâncias personalizadas.`;
    }
  }

  function renderCardFooter(p, trecho) {
    if (p.isMe) {
      return `
        <div class="ride-card-footer">
          <span class="self-indicator">${ICONS.check} Seu cadastro</span>
          <button type="button" class="btn btn-secondary btn-sm js-edit-self">
            ${ICONS.edit}
            <span>Editar</span>
          </button>
        </div>
      `;
    }

    const waUrl = buildWhatsAppUrl(p.fullName, p.phone, trecho);

    if (p.role !== 'offer') {
      return `
        <div class="ride-card-footer">
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-full">
            ${ICONS.message}
            <span>Combinar no WhatsApp</span>
          </a>
        </div>
      `;
    }

    // Card de motorista: botao primario (Pedir carona / estado) + secundario (WhatsApp)
    let primaryHtml = '';
    const req = p.myRequest;

    if (req && req.status === 'confirmada') {
      primaryHtml = `
        <div class="request-state-group">
          <span class="status-pill status-pill-confirmed">${ICONS.check} Carona confirmada</span>
          <button type="button" class="btn-link-muted js-cancel-req" data-req-id="${req.id}">
            Cancelar
          </button>
        </div>
      `;
    } else if (req && req.status === 'pendente') {
      primaryHtml = `
        <div class="request-state-group">
          <span class="status-pill status-pill-pending">${ICONS.clock} Solicitação enviada</span>
          <button type="button" class="btn-link-muted js-cancel-req" data-req-id="${req.id}">
            Cancelar
          </button>
        </div>
      `;
    } else if (req && req.status === 'recusada') {
      primaryHtml = `
        <span class="status-pill status-pill-rejected">${ICONS.x} Recusada</span>
      `;
    } else if (p.seatsRemaining <= 0) {
      primaryHtml = `
        <button type="button" class="btn btn-secondary btn-full" disabled>
          Lotado
        </button>
      `;
    } else {
      primaryHtml = `
        <button type="button" class="btn btn-primary btn-full js-request-ride" data-driver-id="${p.id}" data-trecho="${trecho}">
          ${ICONS.send}
          <span>Pedir carona</span>
        </button>
      `;
    }

    return `
      <div class="ride-card-footer">
        <div class="ride-actions-row">
          <div>${primaryHtml}</div>
          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
            ${ICONS.message}
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    `;
  }

  function renderParticipants() {
    if (state.activeTab === 'mine') {
      el.participantsList.classList.add('hidden');
      return;
    }

    el.participantsList.classList.remove('hidden');

    if (!state.participants.length) {
      el.participantsList.innerHTML = `
        <div class="empty-state">
          ${ICONS.search}
          <h3>Nenhum participante encontrado</h3>
          <p>Ajuste os filtros acima ou cadastre sua rota para este trecho.</p>
        </div>
      `;
      return;
    }

    const trecho = state.activeTab === 'return' ? 'volta' : 'ida';

    el.participantsList.innerHTML = state.participants
      .map((p) => {
        const locationLabel =
          state.activeTab === 'outbound' ? p.outboundLabel : p.returnLabel;
        const distanceLabel = formatDistance(p.distanceKm, p.isMe);

        const seatsTag =
          p.role === 'offer'
            ? p.seatsRemaining > 0
              ? `<span class="tag tag-seats-open">${ICONS.users} ${p.seatsRemaining} de ${p.seatsTotal} ${p.seatsRemaining === 1 ? 'vaga livre' : 'vagas livres'}</span>`
              : `<span class="tag tag-seats-full">Lotado</span>`
            : '';

        const notesHtml = p.notes
          ? `<div class="ride-notes">${escapeHtml(p.notes)}</div>`
          : '';

        return `
          <article class="ride-card ${p.isMe ? 'is-me' : ''}">
            <div class="ride-card-top">
              <h3 class="ride-name">${escapeHtml(p.fullName)}</h3>
              <span class="distance-badge">
                ${ICONS.navigation}
                <span>${escapeHtml(distanceLabel)}</span>
              </span>
            </div>

            <div class="ride-location">
              ${ICONS.mapPin}
              <span>${escapeHtml(locationLabel)}</span>
            </div>

            <div class="tags-row">
              <span class="tag tag-${p.role}">${ROLE_LABELS[p.role]}</span>
              ${seatsTag}
              <span class="tag tag-profile">${PARTY_LABELS[p.partyProfile]}</span>
            </div>

            ${notesHtml}
            ${renderCardFooter(p, trecho)}
          </article>
        `;
      })
      .join('');

    bindParticipantCardActions();
  }

  function bindParticipantCardActions() {
    const selfEditBtn = el.participantsList.querySelector('.js-edit-self');
    if (selfEditBtn) {
      selfEditBtn.addEventListener('click', () => openProfileModal('edit'));
    }

    el.participantsList.querySelectorAll('.js-request-ride').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!state.myId || !state.editToken) {
          showToast('Cadastre sua rota antes de pedir carona.');
          openProfileModal('new');
          return;
        }
        const motoristaId = btn.dataset.driverId;
        const trecho = btn.dataset.trecho;
        btn.disabled = true;
        try {
          await apiFetch('/api/requests', {
            method: 'POST',
            headers: { 'X-Edit-Token': state.editToken },
            body: JSON.stringify({ motoristaId, trecho }),
          });
          showToast('Solicitação enviada ao motorista.');
          await loadParticipants();
        } catch (error) {
          showToast(error.message);
          btn.disabled = false;
        }
      });
    });

    el.participantsList.querySelectorAll('.js-cancel-req').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const reqId = btn.dataset.reqId;
        btn.disabled = true;
        try {
          await apiFetch(`/api/requests/${reqId}/status`, {
            method: 'PATCH',
            headers: { 'X-Edit-Token': state.editToken },
            body: JSON.stringify({ status: 'cancelada' }),
          });
          showToast('Solicitação cancelada.');
          await loadParticipants();
        } catch (error) {
          showToast(error.message);
          btn.disabled = false;
        }
      });
    });
  }

  function renderRequestItemHtml(item, mode) {
    const waUrl = buildWhatsAppUrl(
      item.peer.fullName,
      item.peer.phone,
      item.trecho
    );
    const distLabel = formatDistance(item.peer.distanceKm, false);
    const notesHtml = item.peer.notes
      ? `<div class="ride-notes">${escapeHtml(item.peer.notes)}</div>`
      : '';

    let actionsHtml = '';

    if (mode === 'driver-pending') {
      actionsHtml = `
        <button type="button" class="btn btn-primary btn-sm js-req-action" data-req-id="${item.id}" data-next-status="confirmada">
          ${ICONS.check}
          <span>Confirmar</span>
        </button>
        <button type="button" class="btn btn-secondary btn-sm js-req-action" data-req-id="${item.id}" data-next-status="recusada">
          ${ICONS.x}
          <span>Recusar</span>
        </button>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
          ${ICONS.message}
          <span>WhatsApp</span>
        </a>
      `;
    } else if (mode === 'driver-confirmed') {
      actionsHtml = `
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
          ${ICONS.message}
          <span>WhatsApp</span>
        </a>
        <button type="button" class="btn-link-muted js-req-action" data-req-id="${item.id}" data-next-status="cancelada">
          Remover passageiro
        </button>
      `;
    } else if (mode === 'passenger-sent') {
      const statusMap = {
        pendente: '<span class="status-pill status-pill-pending">Pendente</span>',
        confirmada: '<span class="status-pill status-pill-confirmed">Carona confirmada</span>',
        recusada: '<span class="status-pill status-pill-rejected">Recusada</span>',
      };
      const canCancel = item.status === 'pendente' || item.status === 'confirmada';
      actionsHtml = `
        ${statusMap[item.status] || ''}
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
          ${ICONS.message}
          <span>WhatsApp</span>
        </a>
        ${
          canCancel
            ? `<button type="button" class="btn-link-muted js-req-action" data-req-id="${item.id}" data-next-status="cancelada">Cancelar</button>`
            : ''
        }
      `;
    }

    return `
      <div class="request-item">
        <div class="request-item-top">
          <h4 class="request-item-name">${escapeHtml(item.peer.fullName)}</h4>
          <span class="distance-badge">
            ${ICONS.navigation}
            <span>${escapeHtml(distLabel)}</span>
          </span>
        </div>
        ${
          item.peer.locationLabel
            ? `<div class="request-item-meta">${ICONS.mapPin}<span>${escapeHtml(item.peer.locationLabel)}</span></div>`
            : ''
        }
        ${notesHtml}
        <div class="request-item-actions">${actionsHtml}</div>
      </div>
    `;
  }

  function renderMyRidesPanel() {
    if (state.activeTab !== 'mine') {
      el.myRidesPanel.classList.add('hidden');
      return;
    }

    el.myRidesPanel.classList.remove('hidden');

    if (!state.me || !state.editToken) {
      el.myRidesPanel.innerHTML = `
        <div class="empty-state">
          ${ICONS.car}
          <h3>Cadastre sua rota primeiro</h3>
          <p>Para gerenciar solicitações recebidas ou acompanhar seus pedidos de carona, faça seu cadastro ou recupere pelo WhatsApp.</p>
        </div>
      `;
      return;
    }

    if (!state.myRides) {
      el.myRidesPanel.innerHTML = `
        <div class="empty-state">
          <h3>Carregando suas caronas...</h3>
        </div>
      `;
      return;
    }

    const { driverSummary, received, sent } = state.myRides;
    const isDriverAnywhere = driverSummary.offersIda || driverSummary.offersVolta;

    const pendingIda = received.filter(
      (r) => r.trecho === 'ida' && r.status === 'pendente'
    );
    const pendingVolta = received.filter(
      (r) => r.trecho === 'volta' && r.status === 'pendente'
    );
    const confirmedIda = received.filter(
      (r) => r.trecho === 'ida' && r.status === 'confirmada'
    );
    const confirmedVolta = received.filter(
      (r) => r.trecho === 'volta' && r.status === 'confirmada'
    );

    const sentIda = sent.filter((r) => r.trecho === 'ida');
    const sentVolta = sent.filter((r) => r.trecho === 'volta');

    let html = '';

    if (isDriverAnywhere) {
      // Bloco de Solicitacoes Recebidas
      html += `
        <div class="panel-section">
          <div class="panel-section-head">
            <h3 class="panel-section-title">${ICONS.users} Solicitações recebidas</h3>
          </div>
          ${
            driverSummary.offersIda
              ? `<div class="panel-subblock">
                   <p class="panel-subblock-title">
                     <span>Ida</span>
                     <span>${driverSummary.remainingIda} de ${driverSummary.vagasIda} livres</span>
                   </p>
                   ${
                     pendingIda.length
                       ? pendingIda.map((r) => renderRequestItemHtml(r, 'driver-pending')).join('')
                       : '<p class="panel-empty-text">Nenhuma solicitação pendente para a ida.</p>'
                   }
                 </div>`
              : ''
          }
          ${
            driverSummary.offersVolta
              ? `<div class="panel-subblock">
                   <p class="panel-subblock-title">
                     <span>Volta</span>
                     <span>${driverSummary.remainingVolta} de ${driverSummary.vagasVolta} livres</span>
                   </p>
                   ${
                     pendingVolta.length
                       ? pendingVolta.map((r) => renderRequestItemHtml(r, 'driver-pending')).join('')
                       : '<p class="panel-empty-text">Nenhuma solicitação pendente para a volta.</p>'
                   }
                 </div>`
              : ''
          }
        </div>

        <div class="panel-section">
          <div class="panel-section-head">
            <h3 class="panel-section-title">${ICONS.check} Passageiros confirmados</h3>
          </div>
          ${
            driverSummary.offersIda
              ? `<div class="panel-subblock">
                   <p class="panel-subblock-title">
                     <span>Ida</span>
                     <span>${driverSummary.confirmedIda}/${driverSummary.vagasIda} ocupadas</span>
                   </p>
                   ${
                     confirmedIda.length
                       ? confirmedIda.map((r) => renderRequestItemHtml(r, 'driver-confirmed')).join('')
                       : '<p class="panel-empty-text">Nenhum passageiro confirmado na ida ainda.</p>'
                   }
                 </div>`
              : ''
          }
          ${
            driverSummary.offersVolta
              ? `<div class="panel-subblock">
                   <p class="panel-subblock-title">
                     <span>Volta</span>
                     <span>${driverSummary.confirmedVolta}/${driverSummary.vagasVolta} ocupadas</span>
                   </p>
                   ${
                     confirmedVolta.length
                       ? confirmedVolta.map((r) => renderRequestItemHtml(r, 'driver-confirmed')).join('')
                       : '<p class="panel-empty-text">Nenhum passageiro confirmado na volta ainda.</p>'
                   }
                 </div>`
              : ''
          }
        </div>
      `;
    }

    // Bloco de Pedidos Enviados (Passageiro)
    html += `
      <div class="panel-section">
        <div class="panel-section-head">
          <h3 class="panel-section-title">${ICONS.send} Meus pedidos de carona</h3>
        </div>
        ${
          sentIda.length || sentVolta.length
            ? `
              ${
                sentIda.length
                  ? `<div class="panel-subblock">
                       <p class="panel-subblock-title"><span>Ida</span></p>
                       ${sentIda.map((r) => renderRequestItemHtml(r, 'passenger-sent')).join('')}
                     </div>`
                  : ''
              }
              ${
                sentVolta.length
                  ? `<div class="panel-subblock">
                       <p class="panel-subblock-title"><span>Volta</span></p>
                       ${sentVolta.map((r) => renderRequestItemHtml(r, 'passenger-sent')).join('')}
                     </div>`
                  : ''
              }
            `
            : '<p class="panel-empty-text">Você ainda não enviou pedidos de carona. Explore as abas Ida e Volta para solicitar.</p>'
        }
      </div>
    `;

    el.myRidesPanel.innerHTML = html;

    el.myRidesPanel.querySelectorAll('.js-req-action').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const reqId = btn.dataset.reqId;
        const nextStatus = btn.dataset.nextStatus;
        btn.disabled = true;
        try {
          await apiFetch(`/api/requests/${reqId}/status`, {
            method: 'PATCH',
            headers: { 'X-Edit-Token': state.editToken },
            body: JSON.stringify({ status: nextStatus }),
          });
          const feedback = {
            confirmada: 'Carona confirmada e vaga atualizada.',
            recusada: 'Solicitação recusada.',
            cancelada: 'Solicitação removida com sucesso.',
          };
          showToast(feedback[nextStatus] || 'Atualizado.');
          await refreshActiveView();
        } catch (error) {
          showToast(error.message);
          btn.disabled = false;
        }
      });
    });
  }

  function renderAll() {
    updatePendingBadge();
    renderMyStatusCard();
    renderStats();

    const isMine = state.activeTab === 'mine';
    el.listFiltersWrap.classList.toggle('hidden', isMine);

    if (!isMine) {
      renderReferenceCaption();
    }
    renderParticipants();
    renderMyRidesPanel();
  }

  function switchTab(tab) {
    state.activeTab = tab;
    [
      [el.tabOutbound, 'outbound'],
      [el.tabReturn, 'return'],
      [el.tabMine, 'mine'],
    ].forEach(([btn, key]) => {
      const active = tab === key;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    refreshActiveView();
  }

  // ---------------- Modal & Form Logic ----------------
  function getRadioValue(name, fallback) {
    return (
      el.profileForm.querySelector(`input[name="${name}"]:checked`)?.value ||
      fallback
    );
  }

  function setRadioValue(name, value) {
    const radio = el.profileForm.querySelector(
      `input[name="${name}"][value="${value}"]`
    );
    if (radio) radio.checked = true;
  }

  function syncFormVisibility() {
    const scope = getRadioValue('tripScope', 'both');
    const showOutbound = scope === 'both' || scope === 'outbound_only';
    const showReturn = scope === 'both' || scope === 'return_only';

    el.outboundSection.classList.toggle('hidden', !showOutbound);
    el.returnSection.classList.toggle('hidden', !showReturn);

    // Opcao "Nao preciso (volto de app)" so faz sentido quando scope === 'both'
    el.returnRoleNoneOption.classList.toggle('hidden', scope !== 'both');
    if (scope === 'return_only' && getRadioValue('returnRole', 'offer') === 'none') {
      setRadioValue('returnRole', 'need');
    }

    const outboundRole = getRadioValue('outboundRole', 'offer');
    const returnRole = getRadioValue('returnRole', 'offer');

    el.outboundSeatsField.classList.toggle('hidden', outboundRole !== 'offer');
    el.returnSeatsField.classList.toggle('hidden', returnRole !== 'offer');
    el.returnLocationField.classList.toggle('hidden', returnRole === 'none');
  }

  function handleDrinkProfileChange() {
    const partyProfile = getRadioValue('partyProfile', 'no_preference');
    const scope = getRadioValue('tripScope', 'both');
    const outboundRole = getRadioValue('outboundRole', 'offer');
    const returnRole = getRadioValue('returnRole', 'offer');

    if (
      partyProfile === 'will_drink' &&
      scope === 'both' &&
      outboundRole === 'offer' &&
      returnRole === 'offer'
    ) {
      setRadioValue('returnRole', 'need');
      el.drinkHelperNote.classList.remove('hidden');
      syncFormVisibility();
    } else if (partyProfile !== 'will_drink') {
      el.drinkHelperNote.classList.add('hidden');
    }
  }

  function updateGeoStatus(target, text, isConfirmed) {
    const statusEl =
      target === 'outbound' ? el.outboundGeoStatus : el.returnGeoStatus;
    statusEl.textContent = text;
    statusEl.classList.toggle('confirmed', Boolean(isConfirmed));
  }

  function setOfficeOutbound(active) {
    state.outboundGeo.isOffice = active;
    el.btnOfficeQuick.classList.toggle('active', active);
    if (active) {
      state.outboundGeo.label = state.spsOffice.label;
      state.outboundGeo.lat = state.spsOffice.lat;
      state.outboundGeo.lng = state.spsOffice.lng;
      el.inputOutbound.value = state.spsOffice.label;
      el.outboundSuggestions.classList.add('hidden');
      updateGeoStatus('outbound', 'Coordenadas do Escritório SPS definidas.', true);
    }
  }

  function openProfileModal(mode) {
    el.profileError.classList.add('hidden');
    el.recoverError.classList.add('hidden');
    el.drinkHelperNote.classList.add('hidden');
    el.outboundSuggestions.classList.add('hidden');
    el.returnSuggestions.classList.add('hidden');

    if (mode === 'edit' && state.me) {
      state.isEditing = true;
      el.modalTitle.textContent = 'Editar meu cadastro';
      el.modalSubtitle.textContent = 'Configure ida e volta de forma independente.';
      el.modalModeSwitch.classList.add('hidden');
      el.recoverForm.classList.add('hidden');
      el.profileForm.classList.remove('hidden');
      el.profileDeleteBtn.classList.remove('hidden');
      el.profileSubmitBtn.textContent = 'Salvar alterações';

      const me = state.me;
      el.inputFullName.value = me.fullName;
      el.inputPhone.value = formatPhoneMask(me.phone);
      setRadioValue('partyProfile', me.partyProfile || 'no_preference');
      setRadioValue('tripScope', me.tripScope || 'both');

      setRadioValue(
        'outboundRole',
        me.outboundRole && me.outboundRole !== 'none' ? me.outboundRole : 'need'
      );
      setRadioValue(
        'returnRole',
        me.returnRole && me.returnRole !== 'none' ? me.returnRole : 'need'
      );

      el.inputSeatsIda.value = String(
        me.outboundRole === 'offer' ? me.vagasIda : 3
      );
      el.inputSeatsVolta.value = String(
        me.returnRole === 'offer' ? me.vagasVolta : 3
      );

      state.outboundGeo = {
        isOffice: Boolean(me.outboundIsOffice),
        label: me.outboundLabel || '',
        lat: me.outboundLat,
        lng: me.outboundLng,
      };
      el.inputOutbound.value = me.outboundLabel || '';
      el.btnOfficeQuick.classList.toggle('active', Boolean(me.outboundIsOffice));
      updateGeoStatus(
        'outbound',
        me.outboundLat !== null ? 'Localização aproximada confirmada.' : '',
        me.outboundLat !== null
      );

      state.returnGeo = {
        label: me.returnLabel || '',
        lat: me.returnLat,
        lng: me.returnLng,
      };
      el.inputReturn.value = me.returnLabel || '';
      updateGeoStatus(
        'return',
        me.returnLat !== null ? 'Localização aproximada confirmada.' : '',
        me.returnLat !== null
      );

      el.inputNotes.value = me.notes || '';
      syncFormVisibility();
    } else {
      state.isEditing = false;
      el.modalTitle.textContent = 'Cadastrar minha rota';
      el.modalSubtitle.textContent =
        'Informe apenas bairro ou cidade para manter sua privacidade.';
      el.modalModeSwitch.classList.remove('hidden');
      el.profileDeleteBtn.classList.add('hidden');
      el.profileSubmitBtn.textContent = 'Salvar cadastro';

      el.profileForm.reset();
      setRadioValue('tripScope', 'both');
      setRadioValue('outboundRole', 'offer');
      setRadioValue('returnRole', 'offer');
      setRadioValue('partyProfile', 'no_preference');
      el.inputSeatsIda.value = '3';
      el.inputSeatsVolta.value = '3';
      syncFormVisibility();

      state.outboundGeo = { isOffice: false, label: '', lat: null, lng: null };
      state.returnGeo = { label: '', lat: null, lng: null };
      el.btnOfficeQuick.classList.remove('active');
      updateGeoStatus('outbound', '', false);
      updateGeoStatus('return', '', false);

      switchModalMode(mode === 'recover' ? 'recover' : 'new');
    }

    state.modalOpen = true;
    el.profileModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeProfileModal() {
    state.modalOpen = false;
    el.profileModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function switchModalMode(mode) {
    const isRecover = mode === 'recover';
    el.modeNewBtn.classList.toggle('active', !isRecover);
    el.modeRecoverBtn.classList.toggle('active', isRecover);
    el.profileForm.classList.toggle('hidden', isRecover);
    el.recoverForm.classList.toggle('hidden', !isRecover);
    if (isRecover) {
      el.recoverPhoneInput.focus();
    }
  }

  // ---------------- Geocode Autocomplete with Debounce ----------------
  function setupLocationAutocomplete(inputEl, listEl, targetKey) {
    let debounceTimer = null;
    let lastRequestId = 0;

    inputEl.addEventListener('input', () => {
      const value = inputEl.value.trim();

      if (targetKey === 'outbound') {
        state.outboundGeo.isOffice = false;
        state.outboundGeo.lat = null;
        state.outboundGeo.lng = null;
        state.outboundGeo.label = value;
        el.btnOfficeQuick.classList.remove('active');
      } else {
        state.returnGeo.lat = null;
        state.returnGeo.lng = null;
        state.returnGeo.label = value;
      }

      clearTimeout(debounceTimer);

      if (value.length < 3) {
        listEl.classList.add('hidden');
        listEl.innerHTML = '';
        updateGeoStatus(targetKey, '', false);
        return;
      }

      updateGeoStatus(targetKey, 'Buscando localização aproximada...', false);

      debounceTimer = setTimeout(async () => {
        const reqId = ++lastRequestId;
        try {
          const data = await apiFetch(
            `/api/geocode?q=${encodeURIComponent(value)}`
          );
          if (reqId !== lastRequestId) return;

          const results = data.results || [];
          if (!results.length) {
            listEl.classList.add('hidden');
            updateGeoStatus(
              targetKey,
              'Nenhuma sugestão encontrada. Tente incluir a cidade (ex: Urbanova, São José dos Campos).',
              false
            );
            return;
          }

          listEl.innerHTML = results
            .map(
              (item, idx) => `
              <button type="button" class="suggestion-item" data-idx="${idx}">
                ${ICONS.mapPin}
                <span>${escapeHtml(item.label)}</span>
              </button>
            `
            )
            .join('');
          listEl.classList.remove('hidden');
          updateGeoStatus(
            targetKey,
            'Selecione uma opção abaixo para ativar o cálculo de distância.',
            false
          );

          listEl.querySelectorAll('.suggestion-item').forEach((btn) => {
            btn.addEventListener('click', () => {
              const selected = results[Number(btn.dataset.idx)];
              inputEl.value = selected.label;
              if (targetKey === 'outbound') {
                state.outboundGeo = {
                  isOffice: false,
                  label: selected.label,
                  lat: selected.lat,
                  lng: selected.lng,
                };
              } else {
                state.returnGeo = {
                  label: selected.label,
                  lat: selected.lat,
                  lng: selected.lng,
                };
              }
              listEl.classList.add('hidden');
              updateGeoStatus(
                targetKey,
                'Localização aproximada confirmada.',
                true
              );
            });
          });
        } catch (error) {
          if (reqId !== lastRequestId) return;
          listEl.classList.add('hidden');
          updateGeoStatus(targetKey, error.message, false);
        }
      }, 450);
    });

    document.addEventListener('click', (event) => {
      if (!inputEl.contains(event.target) && !listEl.contains(event.target)) {
        listEl.classList.add('hidden');
      }
    });
  }

  // ---------------- Event Listeners ----------------
  function bindEvents() {
    el.gateForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      el.gateError.classList.add('hidden');
      const code = el.accessCodeInput.value.trim();
      if (!code) {
        el.gateError.textContent = 'Informe o código de acesso.';
        el.gateError.classList.remove('hidden');
        return;
      }

      el.gateSubmitBtn.disabled = true;
      try {
        const data = await apiFetch('/api/auth/verify', {
          method: 'POST',
          body: JSON.stringify({ code }),
        });
        state.accessCode = code;
        if (data.spsOffice) {
          state.spsOffice = data.spsOffice;
        }
        localStorage.setItem(STORAGE_KEYS.accessCode, code);
        showMainApp();
        await refreshActiveView();
        startPolling();
      } catch (error) {
        el.gateError.textContent = error.message;
        el.gateError.classList.remove('hidden');
      } finally {
        el.gateSubmitBtn.disabled = false;
      }
    });

    el.headerProfileBtn.addEventListener('click', () => {
      openProfileModal(state.me ? 'edit' : 'new');
    });

    [el.tabOutbound, el.tabReturn, el.tabMine].forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        if (state.activeTab === targetTab) return;
        switchTab(targetTab);
      });
    });

    el.roleFilterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.roleFilter = btn.dataset.roleFilter || '';
        el.roleFilterBtns.forEach((b) => b.classList.toggle('active', b === btn));
        loadParticipants();
      });
    });

    el.filterOnlySeats.addEventListener('click', () => {
      state.onlyWithSeats = !state.onlyWithSeats;
      el.filterOnlySeats.classList.toggle('active', state.onlyWithSeats);
      loadParticipants();
    });

    el.filterNoDrink.addEventListener('click', () => {
      state.noDrinkOnly = !state.noDrinkOnly;
      el.filterNoDrink.classList.toggle('active', state.noDrinkOnly);
      loadParticipants();
    });

    el.modalCloseBtn.addEventListener('click', closeProfileModal);
    el.profileModal.addEventListener('click', (event) => {
      if (event.target === el.profileModal) closeProfileModal();
    });

    el.modeNewBtn.addEventListener('click', () => switchModalMode('new'));
    el.modeRecoverBtn.addEventListener('click', () => switchModalMode('recover'));

    [el.inputPhone, el.recoverPhoneInput].forEach((input) => {
      input.addEventListener('input', () => {
        input.value = formatPhoneMask(input.value);
      });
    });

    el.profileForm
      .querySelectorAll('input[name="tripScope"], input[name="outboundRole"], input[name="returnRole"]')
      .forEach((radio) => {
        radio.addEventListener('change', syncFormVisibility);
      });

    el.profileForm
      .querySelectorAll('input[name="partyProfile"]')
      .forEach((radio) => {
        radio.addEventListener('change', handleDrinkProfileChange);
      });

    const bindStepper = (decBtn, incBtn, inputEl) => {
      decBtn.addEventListener('click', () => {
        const current = Number(inputEl.value) || 0;
        inputEl.value = String(Math.max(0, current - 1));
      });
      incBtn.addEventListener('click', () => {
        const current = Number(inputEl.value) || 0;
        inputEl.value = String(Math.min(15, current + 1));
      });
    };

    bindStepper(el.seatsIdaDec, el.seatsIdaInc, el.inputSeatsIda);
    bindStepper(el.seatsVoltaDec, el.seatsVoltaInc, el.inputSeatsVolta);

    el.btnOfficeQuick.addEventListener('click', () => {
      setOfficeOutbound(!state.outboundGeo.isOffice);
    });

    setupLocationAutocomplete(el.inputOutbound, el.outboundSuggestions, 'outbound');
    setupLocationAutocomplete(el.inputReturn, el.returnSuggestions, 'return');

    el.recoverForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      el.recoverError.classList.add('hidden');
      el.recoverSubmitBtn.disabled = true;

      try {
        const data = await apiFetch('/api/participants/lookup', {
          method: 'POST',
          body: JSON.stringify({ phone: el.recoverPhoneInput.value }),
        });
        saveMySession(data.participant, data.editToken);
        showToast('Cadastro recuperado com sucesso.');
        openProfileModal('edit');
        await refreshActiveView();
      } catch (error) {
        el.recoverError.textContent = error.message;
        el.recoverError.classList.remove('hidden');
      } finally {
        el.recoverSubmitBtn.disabled = false;
      }
    });

    el.profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      el.profileError.classList.add('hidden');

      const tripScope = getRadioValue('tripScope', 'both');
      const hasOutbound = tripScope === 'both' || tripScope === 'outbound_only';
      const hasReturn = tripScope === 'both' || tripScope === 'return_only';

      const outboundRole = hasOutbound
        ? getRadioValue('outboundRole', 'offer')
        : 'none';
      const returnRole = hasReturn
        ? getRadioValue('returnRole', 'offer')
        : 'none';
      const partyProfile = getRadioValue('partyProfile', 'no_preference');

      const payload = {
        fullName: el.inputFullName.value.trim(),
        phone: el.inputPhone.value,
        tripScope,
        outboundRole,
        returnRole,
        vagasIda: outboundRole === 'offer' ? Number(el.inputSeatsIda.value) : 0,
        vagasVolta: returnRole === 'offer' ? Number(el.inputSeatsVolta.value) : 0,
        outboundIsOffice: outboundRole !== 'none' ? state.outboundGeo.isOffice : false,
        outboundLabel: outboundRole !== 'none' ? el.inputOutbound.value.trim() : '',
        outboundLat: outboundRole !== 'none' ? state.outboundGeo.lat : null,
        outboundLng: outboundRole !== 'none' ? state.outboundGeo.lng : null,
        returnLabel: returnRole !== 'none' ? el.inputReturn.value.trim() : '',
        returnLat: returnRole !== 'none' ? state.returnGeo.lat : null,
        returnLng: returnRole !== 'none' ? state.returnGeo.lng : null,
        partyProfile,
        notes: el.inputNotes.value.trim(),
      };

      el.profileSubmitBtn.disabled = true;

      try {
        if (state.isEditing && state.myId && state.editToken) {
          const data = await apiFetch(`/api/participants/${state.myId}`, {
            method: 'PUT',
            headers: { 'X-Edit-Token': state.editToken },
            body: JSON.stringify(payload),
          });
          saveMySession(data.participant);
          showToast('Cadastro atualizado com sucesso.');
        } else {
          const data = await apiFetch('/api/participants', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          saveMySession(data.participant, data.editToken);
          showToast('Cadastro salvo com sucesso.');
        }

        closeProfileModal();
        await refreshActiveView();
      } catch (error) {
        el.profileError.textContent = error.message;
        el.profileError.classList.remove('hidden');
      } finally {
        el.profileSubmitBtn.disabled = false;
      }
    });

    el.profileDeleteBtn.addEventListener('click', async () => {
      if (!state.myId || !state.editToken) return;
      const confirmed = window.confirm(
        'Tem certeza que deseja remover seu cadastro do Rota da Confra?'
      );
      if (!confirmed) return;

      el.profileDeleteBtn.disabled = true;
      try {
        await apiFetch(`/api/participants/${state.myId}`, {
          method: 'DELETE',
          headers: { 'X-Edit-Token': state.editToken },
        });
        clearMySession();
        closeProfileModal();
        showToast('Seu cadastro foi removido.');
        await refreshActiveView();
      } catch (error) {
        el.profileError.textContent = error.message;
        el.profileError.classList.remove('hidden');
      } finally {
        el.profileDeleteBtn.disabled = false;
      }
    });

    // Atualiza ao focar na janela ou retornar para a aba
    window.addEventListener('focus', () => {
      if (state.accessCode && !state.modalOpen) {
        refreshActiveView(true);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && state.accessCode && !state.modalOpen) {
        refreshActiveView(true);
      }
    });
  }

  async function bootstrap() {
    bindEvents();

    if (!state.accessCode) {
      showGateScreen();
      return;
    }

    try {
      const cfg = await apiFetch('/api/auth/config');
      if (cfg.spsOffice) {
        state.spsOffice = cfg.spsOffice;
      }
      showMainApp();
      await refreshActiveView();
      startPolling();
    } catch {
      showGateScreen();
    }
  }

  bootstrap();
})();
