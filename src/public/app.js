(() => {
  'use strict';

  const STORAGE_KEYS = {
    accessCode: 'rota_confra_access_code',
    participantId: 'rota_confra_participant_id',
    editToken: 'rota_confra_edit_token',
  };

  const state = {
    accessCode: localStorage.getItem(STORAGE_KEYS.accessCode) || '',
    myId: localStorage.getItem(STORAGE_KEYS.participantId) || '',
    editToken: localStorage.getItem(STORAGE_KEYS.editToken) || '',
    spsOffice: {
      label: 'Escritório SPS (Jardim Limoeiro, São José dos Campos - SP)',
      lat: -23.237,
      lng: -45.9087,
    },
    direction: 'outbound',
    roleFilter: '',
    onlyWithSeats: false,
    noDrinkOnly: false,
    me: null,
    participants: [],
    stats: null,
    referenceSource: 'none',
    isEditing: false,
    outboundGeo: { isOffice: false, label: '', lat: null, lng: null },
    returnGeo: { label: '', lat: null, lng: null },
  };

  const ROLE_LABELS = {
    offer: 'Oferece carona',
    need: 'Precisa de carona',
    split: 'Dividir app',
  };

  const PARTY_LABELS = {
    no_drink: 'Não vai beber (motorista)',
    will_drink: 'Vou beber (apenas ida)',
    no_preference: 'Sem preferência',
  };

  const ICONS = {
    mapPin:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    navigation:
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
    message:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    check:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    edit:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    plus:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    search:
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    users:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
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
    referenceCaption: document.getElementById('reference-caption'),
    participantsList: document.getElementById('participants-list'),

    tabOutbound: document.getElementById('tab-outbound'),
    tabReturn: document.getElementById('tab-return'),
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
    seatsField: document.getElementById('seats-field'),
    inputSeats: document.getElementById('input-seats'),
    seatsDec: document.getElementById('seats-dec'),
    seatsInc: document.getElementById('seats-inc'),
    btnOfficeQuick: document.getElementById('btn-office-quick'),
    inputOutbound: document.getElementById('input-outbound'),
    outboundSuggestions: document.getElementById('outbound-suggestions'),
    outboundGeoStatus: document.getElementById('outbound-geo-status'),
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

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.add('hidden');
    }, 3200);
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

  function buildWhatsAppUrl(participant, direction) {
    const firstName = participant.fullName.trim().split(/\s+/)[0] || participant.fullName;
    const tripText =
      direction === 'outbound'
        ? 'na ida para o Espaço Lagoon'
        : 'na volta do Espaço Lagoon';
    const message = `Olá, ${firstName}! Vi seu cadastro no Rota da Confra (SPS Group) e gostaria de combinar carona ${tripText}.`;
    return `https://wa.me/55${participant.phone}?text=${encodeURIComponent(message)}`;
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
    localStorage.removeItem(STORAGE_KEYS.participantId);
    localStorage.removeItem(STORAGE_KEYS.editToken);
  }

  async function loadParticipants() {
    const params = new URLSearchParams({
      direction: state.direction,
    });

    if (state.myId) params.set('myId', state.myId);
    if (state.roleFilter) params.set('role', state.roleFilter);
    if (state.onlyWithSeats) params.set('onlyWithSeats', 'true');
    if (state.noDrinkOnly) params.set('noDrinkOnly', 'true');

    try {
      const data = await apiFetch(`/api/participants?${params.toString()}`);
      state.participants = data.participants || [];
      state.stats = data.stats || null;
      state.referenceSource = data.referenceSource || 'none';
      state.me = data.me || null;

      if (state.myId && !state.me) {
        clearMySession();
      }

      renderAll();
    } catch (error) {
      showToast(error.message);
    }
  }

  function renderMyStatusCard() {
    if (!state.me) {
      el.headerProfileBtnLabel.textContent = 'Cadastrar';
      el.myStatusCard.innerHTML = `
        <div class="cta-header">
          <div>
            <h2 class="cta-title">Organize sua carona para a festa</h2>
            <p class="cta-desc">Cadastre seu trajeto de ida e volta para ver colegas mais próximos de você.</p>
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
    const isDriver = me.role === 'offer';
    const seatsButtonHtml = isDriver
      ? me.seatsAvailable > 0
        ? `<button type="button" id="quick-seats-btn" class="btn btn-secondary btn-sm" data-next-seats="0">
            ${ICONS.check}
            <span>Marcar vagas preenchidas</span>
          </button>`
        : `<button type="button" id="quick-seats-btn" class="btn btn-primary btn-sm" data-next-seats="1">
            ${ICONS.plus}
            <span>Reabrir 1 vaga</span>
          </button>`
      : '';

    const seatsTag = isDriver
      ? me.seatsAvailable > 0
        ? `<span class="tag tag-seats-open">${me.seatsAvailable} ${me.seatsAvailable === 1 ? 'vaga livre' : 'vagas livres'}</span>`
        : `<span class="tag tag-seats-full">Vagas preenchidas</span>`
      : '';

    el.myStatusCard.innerHTML = `
      <div class="cta-header">
        <div>
          <h2 class="cta-title">Seu cadastro: ${escapeHtml(me.fullName)}</h2>
          <p class="cta-desc">Ida: ${escapeHtml(me.outboundLabel)} | Volta: ${escapeHtml(me.returnLabel)}</p>
        </div>
      </div>
      <div class="my-profile-meta">
        <span class="tag tag-${me.role}">${ROLE_LABELS[me.role]}</span>
        ${seatsTag}
        <span class="tag tag-profile">${PARTY_LABELS[me.partyProfile]}</span>
      </div>
      <div class="cta-actions">
        <button type="button" id="quick-edit-btn" class="btn btn-secondary btn-sm">
          ${ICONS.edit}
          <span>Editar dados</span>
        </button>
        ${seatsButtonHtml}
      </div>
    `;

    document.getElementById('quick-edit-btn').addEventListener('click', () => {
      openProfileModal('edit');
    });

    const quickSeatsBtn = document.getElementById('quick-seats-btn');
    if (quickSeatsBtn) {
      quickSeatsBtn.addEventListener('click', async () => {
        const nextSeats = Number(quickSeatsBtn.dataset.nextSeats);
        quickSeatsBtn.disabled = true;
        try {
          await apiFetch(`/api/participants/${state.myId}/seats`, {
            method: 'PATCH',
            headers: { 'X-Edit-Token': state.editToken },
            body: JSON.stringify({ seatsAvailable: nextSeats }),
          });
          showToast(
            nextSeats === 0
              ? 'Vagas marcadas como preenchidas.'
              : 'Vaga reaberta com sucesso.'
          );
          await loadParticipants();
        } catch (error) {
          showToast(error.message);
          quickSeatsBtn.disabled = false;
        }
      });
    }
  }

  function renderStats() {
    if (!state.stats) {
      el.statsRow.innerHTML = '';
      return;
    }

    el.statsRow.innerHTML = `
      <div class="stat-card">
        <span class="stat-value">${state.stats.totalParticipants}</span>
        <span class="stat-label">Participantes</span>
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
    const dirLabel = state.direction === 'outbound' ? 'saída (Ida)' : 'destino (Volta)';
    if (state.referenceSource === 'user') {
      el.referenceCaption.innerHTML = `${ICONS.navigation} Ordenado por proximidade do seu ponto de ${dirLabel}.`;
    } else if (state.referenceSource === 'office') {
      el.referenceCaption.innerHTML = `${ICONS.navigation} Ordenado por proximidade do Escritório SPS. Cadastre sua rota para personalizar.`;
    } else {
      el.referenceCaption.innerHTML = `${ICONS.navigation} Cadastre seu destino de volta para calcular distâncias personalizadas.`;
    }
  }

  function renderParticipants() {
    if (!state.participants.length) {
      el.participantsList.innerHTML = `
        <div class="empty-state">
          ${ICONS.search}
          <h3>Nenhum participante encontrado</h3>
          <p>Ajuste os filtros acima ou seja o primeiro a cadastrar sua rota.</p>
        </div>
      `;
      return;
    }

    el.participantsList.innerHTML = state.participants
      .map((p) => {
        const locationLabel =
          state.direction === 'outbound' ? p.outboundLabel : p.returnLabel;
        const distanceLabel = formatDistance(p.distanceKm, p.isMe);

        const seatsTag =
          p.role === 'offer'
            ? p.seatsAvailable > 0
              ? `<span class="tag tag-seats-open">${ICONS.users} ${p.seatsAvailable} ${p.seatsAvailable === 1 ? 'vaga livre' : 'vagas livres'}</span>`
              : `<span class="tag tag-seats-full">Vagas preenchidas</span>`
            : '';

        const notesHtml = p.notes
          ? `<div class="ride-notes">${escapeHtml(p.notes)}</div>`
          : '';

        const footerHtml = p.isMe
          ? `<div class="ride-card-footer">
               <span class="self-indicator">${ICONS.check} Seu cadastro</span>
               <button type="button" class="btn btn-secondary btn-sm js-edit-self">
                 ${ICONS.edit}
                 <span>Editar</span>
               </button>
             </div>`
          : `<div class="ride-card-footer">
               <a
                 href="${buildWhatsAppUrl(p, state.direction)}"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="btn btn-primary btn-full"
               >
                 ${ICONS.message}
                 <span>Combinar no WhatsApp</span>
               </a>
             </div>`;

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
            ${footerHtml}
          </article>
        `;
      })
      .join('');

    const selfEditBtn = el.participantsList.querySelector('.js-edit-self');
    if (selfEditBtn) {
      selfEditBtn.addEventListener('click', () => openProfileModal('edit'));
    }
  }

  function renderAll() {
    renderMyStatusCard();
    renderStats();
    renderReferenceCaption();
    renderParticipants();
  }

  // ---------------- Modal & Form Logic ----------------
  function setRoleSeatsVisibility() {
    const selectedRole =
      el.profileForm.querySelector('input[name="role"]:checked')?.value || 'offer';
    if (selectedRole === 'offer') {
      el.seatsField.classList.remove('hidden');
    } else {
      el.seatsField.classList.add('hidden');
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
    el.outboundSuggestions.classList.add('hidden');
    el.returnSuggestions.classList.add('hidden');

    if (mode === 'edit' && state.me) {
      state.isEditing = true;
      el.modalTitle.textContent = 'Editar meu cadastro';
      el.modalSubtitle.textContent = 'Atualize suas vagas, horários ou localização.';
      el.modalModeSwitch.classList.add('hidden');
      el.recoverForm.classList.add('hidden');
      el.profileForm.classList.remove('hidden');
      el.profileDeleteBtn.classList.remove('hidden');
      el.profileSubmitBtn.textContent = 'Salvar alterações';

      const me = state.me;
      el.inputFullName.value = me.fullName;
      el.inputPhone.value = formatPhoneMask(me.phone);
      const roleRadio = el.profileForm.querySelector(
        `input[name="role"][value="${me.role}"]`
      );
      if (roleRadio) roleRadio.checked = true;
      el.inputSeats.value = String(me.role === 'offer' ? me.seatsAvailable : 3);
      setRoleSeatsVisibility();

      state.outboundGeo = {
        isOffice: Boolean(me.outboundIsOffice),
        label: me.outboundLabel,
        lat: me.outboundLat,
        lng: me.outboundLng,
      };
      el.inputOutbound.value = me.outboundLabel;
      el.btnOfficeQuick.classList.toggle('active', Boolean(me.outboundIsOffice));
      updateGeoStatus(
        'outbound',
        me.outboundLat !== null ? 'Localização aproximada confirmada.' : '',
        me.outboundLat !== null
      );

      state.returnGeo = {
        label: me.returnLabel,
        lat: me.returnLat,
        lng: me.returnLng,
      };
      el.inputReturn.value = me.returnLabel;
      updateGeoStatus(
        'return',
        me.returnLat !== null ? 'Localização aproximada confirmada.' : '',
        me.returnLat !== null
      );

      const partyRadio = el.profileForm.querySelector(
        `input[name="partyProfile"][value="${me.partyProfile}"]`
      );
      if (partyRadio) partyRadio.checked = true;
      el.inputNotes.value = me.notes || '';
    } else {
      state.isEditing = false;
      el.modalTitle.textContent = 'Cadastrar minha rota';
      el.modalSubtitle.textContent =
        'Informe apenas bairro ou cidade para manter sua privacidade.';
      el.modalModeSwitch.classList.remove('hidden');
      el.profileDeleteBtn.classList.add('hidden');
      el.profileSubmitBtn.textContent = 'Salvar cadastro';

      el.profileForm.reset();
      el.inputSeats.value = '3';
      setRoleSeatsVisibility();
      state.outboundGeo = { isOffice: false, label: '', lat: null, lng: null };
      state.returnGeo = { label: '', lat: null, lng: null };
      el.btnOfficeQuick.classList.remove('active');
      updateGeoStatus('outbound', '', false);
      updateGeoStatus('return', '', false);

      switchModalMode(mode === 'recover' ? 'recover' : 'new');
    }

    el.profileModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeProfileModal() {
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
        await loadParticipants();
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

    [el.tabOutbound, el.tabReturn].forEach((tab) => {
      tab.addEventListener('click', () => {
        const dir = tab.dataset.direction;
        if (state.direction === dir) return;
        state.direction = dir;
        el.tabOutbound.classList.toggle('active', dir === 'outbound');
        el.tabOutbound.setAttribute('aria-selected', String(dir === 'outbound'));
        el.tabReturn.classList.toggle('active', dir === 'return');
        el.tabReturn.setAttribute('aria-selected', String(dir === 'return'));
        loadParticipants();
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

    el.profileForm.querySelectorAll('input[name="role"]').forEach((radio) => {
      radio.addEventListener('change', setRoleSeatsVisibility);
    });

    el.seatsDec.addEventListener('click', () => {
      const current = Number(el.inputSeats.value) || 0;
      el.inputSeats.value = String(Math.max(0, current - 1));
    });

    el.seatsInc.addEventListener('click', () => {
      const current = Number(el.inputSeats.value) || 0;
      el.inputSeats.value = String(Math.min(15, current + 1));
    });

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
        await loadParticipants();
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

      const role =
        el.profileForm.querySelector('input[name="role"]:checked')?.value || 'offer';
      const partyProfile =
        el.profileForm.querySelector('input[name="partyProfile"]:checked')?.value ||
        'no_preference';

      const payload = {
        fullName: el.inputFullName.value.trim(),
        phone: el.inputPhone.value,
        role,
        seatsAvailable: role === 'offer' ? Number(el.inputSeats.value) : 0,
        outboundIsOffice: state.outboundGeo.isOffice,
        outboundLabel: el.inputOutbound.value.trim(),
        outboundLat: state.outboundGeo.lat,
        outboundLng: state.outboundGeo.lng,
        returnLabel: el.inputReturn.value.trim(),
        returnLat: state.returnGeo.lat,
        returnLng: state.returnGeo.lng,
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
        await loadParticipants();
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
        await loadParticipants();
      } catch (error) {
        el.profileError.textContent = error.message;
        el.profileError.classList.remove('hidden');
      } finally {
        el.profileDeleteBtn.disabled = false;
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
      await loadParticipants();
    } catch {
      showGateScreen();
    }
  }

  bootstrap();
})();
