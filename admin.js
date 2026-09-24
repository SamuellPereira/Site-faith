(() => {
  const C = window.FAITH_CONFIG || {};
  const T = C.TABLES || { products: 'camisetas', reservations: 'reservas', admins: 'admins' };
  const P = C.COLUMNS?.products || {};
  const R = C.COLUMNS?.reservations || {};
  const supa = window.supabase?.createClient(C.SUPABASE_URL || '', C.SUPABASE_ANON_KEY || '');
  const $ = id => document.getElementById(id);
  const toast = $('toast');
  let session = null;
  let entering = false;

  function notify(message, ok = false) {
    toast.textContent = message;
    toast.className = 'toast show ' + (ok ? 'ok' : 'error');
    setTimeout(() => toast.className = 'toast', 4000);
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[c]));
  }

  function ready() {
    return !!(
      supa &&
      C.SUPABASE_URL &&
      C.SUPABASE_ANON_KEY &&
      !C.SUPABASE_URL.includes('SEU-PROJETO') &&
      !C.SUPABASE_ANON_KEY.includes('SUA-CHAVE')
    );
  }

  function setLoginMessage(message, error = false) {
    const el = $('loginMsg');
    el.textContent = message || '';
    el.className = 'status' + (error ? ' error' : '');
  }

  async function isAllowed(user) {
    if (!user) return { allowed: false, message: 'Usuário não autenticado.' };

    // A autorização é feita no banco, através da função security-definer.
    // Isso evita depender de uma policy SELECT pública na tabela admins.
    const { data, error } = await supa.rpc('sou_admin');

    if (error) {
      console.error('Erro ao verificar administrador:', error);
      return {
        allowed: false,
        message: 'O login funcionou, mas a verificação de administrador falhou. ' +
          'No Supabase, execute o supabase_setup.sql deste projeto e tente novamente. ' +
          'Detalhe: ' + error.message
      };
    }

    if (data === true) return { allowed: true };

    return {
      allowed: false,
      message: 'Esta conta entrou no Supabase, mas ainda não está cadastrada como administrador. ' +
        'Confira se o UUID do usuário está em public.admins com ativo = true.'
    };
  }

  async function init() {
    if (!ready()) {
      setLoginMessage('Configure config.js com as credenciais do Supabase.', true);
      return;
    }

    const { data, error } = await supa.auth.getSession();
    if (error) {
      setLoginMessage('Não foi possível verificar a sessão: ' + error.message, true);
      return;
    }

    if (data.session) {
      await enter(data.session);
    } else {
      showLogin();
    }

    supa.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) await enter(newSession);
      else showLogin();
    });
  }

  async function enter(newSession) {
    if (entering) return;
    entering = true;
    session = newSession;
    setLoginMessage('Verificando acesso administrativo...');

    try {
      const result = await isAllowed(newSession.user);
      if (!result.allowed) {
        await supa.auth.signOut();
        showLogin();
        setLoginMessage(result.message, true);
        return;
      }

      $('loginPanel').classList.add('hidden');
      $('dashboard').classList.remove('hidden');
      await loadAll();
    } catch (error) {
      console.error(error);
      await supa.auth.signOut();
      showLogin();
      setLoginMessage('Erro ao abrir o painel: ' + (error?.message || error), true);
    } finally {
      entering = false;
    }
  }

  function showLogin() {
    session = null;
    $('dashboard').classList.add('hidden');
    $('loginPanel').classList.remove('hidden');
  }

  $('loginForm').onsubmit = async event => {
    event.preventDefault();
    if (!ready()) {
      setLoginMessage('Configure config.js com as credenciais do Supabase.', true);
      return;
    }

    const email = $('email').value.trim();
    const password = $('password').value;
    const button = event.submitter || event.target.querySelector('button');
    button.disabled = true;
    button.textContent = 'Entrando...';
    setLoginMessage('Autenticando...');

    try {
      const { data, error } = await supa.auth.signInWithPassword({ email, password });
      if (error) {
        setLoginMessage('Não foi possível entrar: ' + error.message, true);
        return;
      }
      if (data?.session) await enter(data.session);
    } catch (error) {
      setLoginMessage('Erro inesperado no login: ' + (error?.message || error), true);
    } finally {
      button.disabled = false;
      button.textContent = 'Entrar';
    }
  };

  $('logout').onclick = async () => {
    await supa.auth.signOut();
    showLogin();
  };

  $('productForm').onsubmit = async event => {
    event.preventDefault();
    const row = {};
    row[P.name || 'nome'] = $('pName').value.trim();
    row[P.brand || 'marca'] = $('pBrand').value.trim();
    row[P.stock || 'estoque'] = 1;
    row[P.image || 'imagem'] = $('pImage').value.trim();
    if (P.active) row[P.active] = $('pActive').checked;

    const { error } = await supa.from(T.products).insert(row);
    if (error) {
      notify(error.message);
      return;
    }

    event.target.reset();
    $('pStock').value = 1;
    $('pActive').checked = true;
    notify('Anúncio criado.', true);
    await loadProducts();
  };

  async function loadAll() {
    await Promise.all([loadProducts(), loadReservations()]);
  }

  async function loadProducts() {
    const { data, error } = await supa.from(T.products).select('*').order(P.name || 'nome');
    if (error) {
      $('adminProducts').innerHTML = `<div class="status error">${esc(error.message)}</div>`;
      return;
    }

    $('adminProducts').innerHTML = (data || []).map(product => {
      const id = product[P.id || 'id'];
      const name = product[P.name || 'nome'];
      const active = P.active ? product[P.active] !== false : true;
      return `<article class="admin-product">
        <img src="${esc(product[P.image || 'imagem'] || 'assets/faith-logo.png')}" onerror="this.src='assets/faith-logo.png'">
        <div class="admin-product-body">
          <strong>${esc(name)}</strong>
          <div class="brandline">${esc(product[P.brand || 'marca'] || '')}</div>
          <div class="stock">Estoque: <b>${Number(product[P.stock || 'estoque'] || 0)}</b> · <span class="pill ${active ? 'ok' : 'off'}">${active ? 'ativo' : 'oculto'}</span></div>
          <div class="admin-product-actions">
            <button class="btn ghost" data-toggle="${esc(id)}" data-active="${active}">${active ? 'Ocultar' : 'Ativar'}</button>
            <button class="btn danger" data-delete="${esc(id)}">Apagar</button>
          </div>
        </div>
      </article>`;
    }).join('') || '<div class="empty">Nenhum anúncio.</div>';

    $('adminProducts').querySelectorAll('[data-delete]').forEach(button => {
      button.onclick = () => removeProduct(button.dataset.delete);
    });
    $('adminProducts').querySelectorAll('[data-toggle]').forEach(button => {
      button.onclick = () => toggleProduct(button.dataset.toggle, button.dataset.active === 'true');
    });
  }

  async function removeProduct(id) {
    if (!confirm('Apagar este anúncio?')) return;
    const { error } = await supa.from(T.products).delete().eq(P.id || 'id', id);
    if (error) notify(error.message);
    else {
      notify('Anúncio apagado.', true);
      await loadProducts();
    }
  }

  async function toggleProduct(id, active) {
    const { error } = await supa.from(T.products).update({ [P.active || 'ativo']: !active }).eq(P.id || 'id', id);
    if (error) notify(error.message);
    else await loadProducts();
  }

  async function loadReservations() {
    const { data, error } = await supa
      .from(T.reservations)
      .select('*')
      .order(R.createdAt || 'created_at', { ascending: false })
      .limit(12);

    if (error) {
      $('reservations').innerHTML = `<div class="empty">Não foi possível ler reservas: ${esc(error.message)}</div>`;
      return;
    }

    $('reservations').innerHTML = (data || []).map(reservation =>
      `<div class="reservation-row">
        <strong>${esc(reservation[R.name || 'nome'])}</strong>
        <small>${esc(reservation[R.whatsapp || 'whatsapp'])} · camiseta #${esc(reservation[R.productId || 'camiseta_id'])}</small>
      </div>`
    ).join('') || '<div class="empty">Nenhuma reserva.</div>';
  }

  init();
})();
