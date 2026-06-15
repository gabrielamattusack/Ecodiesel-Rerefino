// ═══════════════════════════════════════
// PROTEÇÃO DE ROTA
// ═══════════════════════════════════════
(function guardRoute() {
  const logado = sessionStorage.getItem('crm_user_nome') || localStorage.getItem('crm_user_nome');
  if (!logado) window.location.replace('login.html');
})();

// ═══════════════════════════════════════
// PERFIL DO USUÁRIO LOGADO
// ═══════════════════════════════════════
const SESSION_USER = {
  nome:    sessionStorage.getItem('crm_user_nome')    || localStorage.getItem('crm_user_nome')    || 'Consultor',
  role:    sessionStorage.getItem('crm_user_papel')   || localStorage.getItem('crm_user_papel')   || 'admin',
  unidade: sessionStorage.getItem('crm_user_unidade') || localStorage.getItem('crm_user_unidade') || '',
};

// Controle de acesso desativado temporariamente — todos veem Empresa


// ═══════════════════════════════════════
// ETAPAS DO PIPELINE
// ═══════════════════════════════════════
const PIPELINE_STAGES = [
  { id: 'oportunidade',     label: 'Oportunidade',     color: '#6366f1' },
  { id: 'agendado',         label: 'Agendado',          color: '#3b82f6' },
  { id: 'comparecido',      label: 'Comparecido',       color: '#10b981' },
  { id: 'faltou',           label: 'Faltou',            color: '#f59e0b' },
  { id: 'contrato-fechado', label: 'Contrato Fechado',  color: '#8b5cf6' },
  { id: 'contrato-pago',    label: 'Contrato Pago',     color: '#22c55e' },
  { id: 'perdas',           label: 'Perdas',            color: '#ef4444' },
];

// ═══════════════════════════════════════
// ÍCONES E LABELS
// ═══════════════════════════════════════
const ICONS = {
  oportunidade_criada: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4h3"/><circle cx="8" cy="8" r="6"/></svg>`,
  card_movido:         `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 5l4 3-4 3"/></svg>`,
  ligacao_registrada:  `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2.5s.5 1 1.5 2.5S7 7 7 7l2-1s1 2 2.5 3.5S14 11.5 14 11.5l-1.5 2c-.5.4-1 .2-1 .2A10 10 0 012.5 4S2.3 3.5 2.8 3L3 2.5z"/></svg>`,
  contrato_fechado:    `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.5l3.5 3.5 8.5-8"/></svg>`,
  cliente_perdido:     `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l12 12M14 2L2 14"/></svg>`,
  card_editado:        `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 2.5l3 3-8 8H2v-3l8-8z"/></svg>`,
};

const TIPO_LABELS = {
  oportunidade_criada: 'Nova Oportunidade',
  card_movido:         'Card Movido',
  ligacao_registrada:  'Ligação Registrada',
  contrato_fechado:    'Contrato Fechado',
  cliente_perdido:     'Cliente Perdido',
  card_editado:        'Card Editado',
};

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316',
  '#f59e0b','#10b981','#06b6d4','#3b82f6','#0ea5e9',
  '#14b8a6','#84cc16','#e11d48','#7c3aed','#0891b2',
];
// Cor derivada do nome da pessoa (determinística, sem depender de ordem de cadastro)
function avatarColor(n) {
  if (!n) return '#71717a';
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ═══════════════════════════════════════
// SEED — inclui campo `coluna` (etapa do pipeline)
// ═══════════════════════════════════════
// Dados de exemplo removidos — começa vazio para nunca repopular o banco.
const SEED = [];

// ═══════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════
const STORAGE_KEY = 'crm_atividades';
function loadLog() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}
function saveLog(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function initLog() {
  const ex = loadLog();
  if (!ex || ex.length === 0) { return [...SEED]; }
  return ex;
}

// ═══════════════════════════════════════
// HELPERS DE TEMPO
// ═══════════════════════════════════════
function fmtTime(ts) {
  const dm = Math.floor((Date.now()-ts)/60000), dh = Math.floor(dm/60), dd = Math.floor(dh/24);
  if (dm < 1) return 'agora mesmo';
  if (dm < 60) return `há ${dm}min`;
  if (dh < 24) return `há ${dh}h`;
  if (dd === 1) return 'ontem';
  return new Date(ts).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function fmtFull(ts) {
  return new Date(ts).toLocaleString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function fmtDateGroup(ts) {
  const d = new Date(ts), today = new Date(), yest = new Date(today-86400000);
  today.setHours(0,0,0,0); yest.setHours(0,0,0,0);
  const dd = new Date(d); dd.setHours(0,0,0,0);
  if (+dd===+today) return 'Hoje';
  if (+dd===+yest)  return 'Ontem';
  return d.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
}
function isToday(ts) { return new Date(ts).toDateString()===new Date().toDateString(); }
function isThisWeek(ts) {
  const ws=new Date(); ws.setDate(ws.getDate()-ws.getDay()); ws.setHours(0,0,0,0);
  return new Date(ts)>=ws;
}

// ═══════════════════════════════════════
// CARDS DE ETAPA DO PIPELINE
// ═══════════════════════════════════════
let activePipeFilter = ''; // '' = todos

function renderPipelineBar(log) {
  const bar = document.getElementById('atPipelineBar');
  const counts = {};
  PIPELINE_STAGES.forEach(s => counts[s.id] = 0);
  log.forEach(e => { if (counts[e.coluna] !== undefined) counts[e.coluna]++; });

  bar.innerHTML = PIPELINE_STAGES.map(s => `
    <div class="at-pipe-card ${activePipeFilter===s.id?'active':''}"
         style="--pipe-color:${s.color}"
         onclick="togglePipeFilter('${s.id}')">
      <span class="at-pipe-label">${s.label}</span>
      <span class="at-pipe-count">${counts[s.id]}</span>
      <span class="at-pipe-sub">atividades</span>
    </div>
  `).join('');
}

function togglePipeFilter(id) {
  activePipeFilter = activePipeFilter === id ? '' : id;
  applyFilters();
}

// ═══════════════════════════════════════
// FEED
// ═══════════════════════════════════════
function renderFeed(log) {
  const feed  = document.getElementById('atFeed');
  const count = document.getElementById('atCount');
  if (log.length === 0) {
    count.textContent = '';
    feed.innerHTML = `
      <div class="at-empty">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="6" y="8" width="28" height="26" rx="4"/><path d="M6 16h28M14 4v8M26 4v8"/>
        </svg>
        <span>Nenhuma atividade encontrada</span>
      </div>`;
    return;
  }
  count.textContent = `${log.length} registro${log.length!==1?'s':''}`;

  // Ordena por data/hora crescente (mais antigo primeiro) para os dias saírem
  // em ordem: sexta, sábado, hoje. A sincronização pode embaralhar o log, então
  // garantimos a ordem aqui antes de agrupar por dia.
  const ordenado = [...log].sort((a, b) => (a.ts || 0) - (b.ts || 0));

  const groups = {};
  ordenado.forEach(e => {
    const k = fmtDateGroup(e.ts);
    if (!groups[k]) groups[k] = [];
    groups[k].push(e);
  });

  const stageLabel = id => PIPELINE_STAGES.find(s=>s.id===id)?.label || id;
  const stageColor = id => PIPELINE_STAGES.find(s=>s.id===id)?.color || '#e4e4e7';

  let html = '';
  Object.entries(groups).forEach(([label, entries]) => {
    html += `<div class="at-group-label">${label}</div>`;
    entries.forEach(e => {
      const sc = stageColor(e.coluna);
      html += `
        <div class="at-entry" onclick="openAtModal('${e.id}')">
          <div class="at-icon ico-${e.tipo}">${ICONS[e.tipo]||''}</div>
          <div class="at-content">
            <div class="at-desc">
              <strong>${e.consultor}</strong> / <span class="at-lead">${e.lead}</span>
              <span style="color:#71717a"> — ${e.detalhe}</span>
            </div>
            <div class="at-meta">
              <span class="at-tag">${TIPO_LABELS[e.tipo]||e.tipo}</span>
              <span class="at-pipe-tag" style="border-left-color:${sc}">${stageLabel(e.coluna)}</span>
              <span class="at-unit">${e.unidade}</span>
              <span class="at-time">${fmtTime(e.ts)}</span>
            </div>
          </div>
        </div>`;
    });
  });
  feed.innerHTML = html;
}

// ═══════════════════════════════════════
// RANKING
// ═══════════════════════════════════════
let rankPeriod = 'today';

function renderRanking(log) {
  const subset = log.filter(e => rankPeriod==='today' ? isToday(e.ts) : isThisWeek(e.ts));
  const byC = {}, unitByC = {};
  subset.forEach(e => { byC[e.consultor]=(byC[e.consultor]||0)+1; unitByC[e.consultor]=e.unidade; });
  const sorted = Object.entries(byC).sort((a,b)=>b[1]-a[1]);
  const max = sorted[0]?.[1]||1;
  const posC = ['gold','silver','bronze'];
  const list = document.getElementById('rankingList');
  if (!sorted.length) {
    list.innerHTML = `<div class="at-rank-empty">Sem atividades${rankPeriod==='today'?' hoje':' esta semana'}.</div>`;
    return;
  }
  list.innerHTML = sorted.map(([nome,cnt],i) => {
    const pct = Math.round((cnt/max)*100);
    const col = avatarColor(nome);
    const ini = nome.split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2);
    return `
      <div class="at-rank-item">
        <div class="at-rank-top">
          <div class="at-rank-pos ${posC[i]||''}">${i+1}</div>
          <div class="at-rank-avatar" style="background:${col}">${ini}</div>
          <div class="at-rank-info">
            <div class="at-rank-name">${nome}</div>
            <div class="at-rank-unit">${unitByC[nome]||''}</div>
          </div>
          <div class="at-rank-count">${cnt}</div>
        </div>
        <div class="at-rank-bar-wrap">
          <div class="at-rank-bar" style="width:${pct}%;background:${col}"></div>
        </div>
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════
// MODAL DETALHES
// ═══════════════════════════════════════
function openAtModal(id) {
  const log = loadLog()||[];
  const e = log.find(x=>x.id===id); if (!e) return;
  document.getElementById('modalIcon').className = `at-modal-icon ico-${e.tipo}`;
  document.getElementById('modalIcon').innerHTML = ICONS[e.tipo]||'';
  document.getElementById('modalTipo').textContent = TIPO_LABELS[e.tipo]||e.tipo;
  document.getElementById('modalTime').textContent = fmtFull(e.ts);
  document.getElementById('modalConsultor').textContent = e.consultor;
  document.getElementById('modalUnidade').textContent = e.unidade;
  document.getElementById('modalLead').textContent = e.lead;
  document.getElementById('modalColuna').textContent = PIPELINE_STAGES.find(s=>s.id===e.coluna)?.label || e.coluna || '—';
  document.getElementById('modalDetalhe').textContent = e.detalhe;
  document.getElementById('atModal').classList.add('open');
}
function closeAtModal() { document.getElementById('atModal').classList.remove('open'); }
function closeModal(e) { if (e.target===document.getElementById('atModal')) closeAtModal(); }

// ═══════════════════════════════════════
// EXPORTAR CSV
// ═══════════════════════════════════════
function exportCSV() {
  const log = getFiltered();
  const stageLabel = id => PIPELINE_STAGES.find(s=>s.id===id)?.label||id;
  const header = ['Data/Hora','Consultor','Unidade','Etapa do Pipeline','Tipo','Lead','Descrição'];
  const rows = log.map(e => [
    new Date(e.ts).toLocaleString('pt-BR'),
    e.consultor, e.unidade,
    stageLabel(e.coluna),
    TIPO_LABELS[e.tipo]||e.tipo,
    e.lead, e.detalhe,
  ]);
  const csv = [header,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'),{href:url,download:`atividades_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.csv`});
  a.click(); URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════
// FILTROS + PERMISSÕES
// ═══════════════════════════════════════
function getFiltered() {
  const consultor = document.getElementById('filterConsultor').value;
  const unidade   = document.getElementById('filterUnit').value;
  const tipo      = document.getElementById('filterTipo').value;
  const de        = document.getElementById('filterDe').value;
  const ate       = document.getElementById('filterAte').value;
  const log       = loadLog()||[];

  return log.filter(e => {
    // Restrição por perfil
    if (SESSION_USER.role === 'consultor'  && e.consultor !== SESSION_USER.nome)   return false;
    if (SESSION_USER.role === 'franqueado' && e.unidade   !== SESSION_USER.unidade) return false;
    if (SESSION_USER.role === 'gerente'    && e.unidade   !== SESSION_USER.unidade) return false;
    // Filtro de etapa do pipeline (cards clicáveis)
    if (activePipeFilter && e.coluna !== activePipeFilter) return false;
    // Filtros manuais
    if (consultor && e.consultor !== consultor) return false;
    if (unidade   && e.unidade   !== unidade)   return false;
    if (tipo      && e.tipo      !== tipo)        return false;
    if (de || ate) {
      const ed = new Date(e.ts).toISOString().slice(0,10);
      if (de  && ed < de)  return false;
      if (ate && ed > ate) return false;
    }
    return true;
  });
}

function popularConsultores() {
  const sel = document.getElementById('filterConsultor');
  if (!sel) return;
  const atual = sel.value;
  // Lista os consultores cadastrados (crm_usuarios), para aparecerem todos
  // mesmo sem atividade registrada ainda — não apenas os que já têm log.
  let usuarios = [];
  try { usuarios = JSON.parse(localStorage.getItem('crm_usuarios') || '[]'); } catch {}
  const nomes = [...new Set(
    usuarios.filter(u => u && u.nome && u.status !== 'inativo').map(u => u.nome)
  )].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  sel.innerHTML = '<option value="">Todos</option>' +
    nomes.map(n => `<option value="${n}"${n === atual ? ' selected' : ''}>${n}</option>`).join('');
}

function applyFilters() {
  popularConsultores();
  const filtered = getFiltered();
  renderPipelineBar(filtered);
  renderFeed(filtered);
  renderRanking(filtered);
}

function clearAll() {
  if (!confirm('Tem certeza que deseja limpar todo o histórico de atividades?')) return;
  saveLog([]);
  renderPipelineBar([]);
  renderFeed([]);
  renderRanking([]);
}

// ═══════════════════════════════════════
// APLICAR RESTRIÇÕES DE PERFIL NA UI
// ═══════════════════════════════════════
function applyRoleRestrictions() {
  const roleNames = { gerente:'Gerente', consultor:'Consultor', franqueado:'Franqueado', admin:'Admin' };
  const elName   = document.getElementById('userName');
  const elAvatar = document.getElementById('userAvatar');
  const elRole   = document.getElementById('userRole');
  if (elName)   elName.textContent   = SESSION_USER.nome;
  if (elAvatar) elAvatar.textContent = SESSION_USER.nome[0].toUpperCase();
  if (elRole)   elRole.textContent   = roleNames[SESSION_USER.role]||SESSION_USER.role;

  const unitSel = document.getElementById('filterUnit');
  const cSel    = document.getElementById('filterConsultor');

  if (SESSION_USER.role === 'gerente') {
    // Gerente: vê todos os consultores da sua unidade — unidade travada
    unitSel.value = SESSION_USER.unidade; unitSel.disabled = true;
  }
  if (SESSION_USER.role === 'franqueado') {
    // Franqueado: só visualiza, unidade travada, sem ações de edição
    unitSel.value = SESSION_USER.unidade; unitSel.disabled = true;
    document.querySelector('.at-clear-btn').style.display = 'none';
  }
  if (SESSION_USER.role === 'consultor') {
    // Consultor: só vê as próprias atividades — consultor e unidade travados
    cSel.value = SESSION_USER.nome; cSel.disabled = true;
    document.querySelector('.at-clear-btn').style.display = 'none';
  }
}

// ═══════════════════════════════════════
// EVENTOS
// ═══════════════════════════════════════
document.getElementById('relatoriosToggle').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('relatoriosToggle').closest('.sb-group').classList.toggle('open');
});

document.querySelectorAll('.at-rank-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.at-rank-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    rankPeriod = btn.dataset.period;
    renderRanking(getFiltered());
  });
});

document.getElementById('exportBtn').addEventListener('click', exportCSV);

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  document.getElementById('filterConsultor').value  = '';
  document.getElementById('filterTipo').value       = '';
  document.getElementById('filterDe').value         = '';
  document.getElementById('filterAte').value        = '';
  // Respeita restrições de perfil ao limpar
  if (SESSION_USER.role !== 'gerente' && SESSION_USER.role !== 'franqueado') {
    document.getElementById('filterUnit').value = '';
  }
  activePipeFilter = '';
  applyFilters();
});

['filterConsultor','filterUnit','filterTipo','filterDe','filterAte'].forEach(id => {
  const el = document.getElementById(id);
  if (el) { el.addEventListener('input', applyFilters); el.addEventListener('change', applyFilters); }
});

// ═══════════════════════════════════════
// INIT — aguarda Supabase antes de renderizar
// ═══════════════════════════════════════
(function crmInit() {
  // Popula select de unidades dinamicamente
  (function popularUnidades() {
    let empresasLS = [];
    try { empresasLS = (JSON.parse(localStorage.getItem('crm_empresas') || '[]')).filter(e => !e.excluido); } catch {}
    const unidades = [...new Set(empresasLS.map(e => e.unidade).filter(Boolean))].sort();
    const sel = document.getElementById('filterUnit');
    if (sel) {
      sel.innerHTML = '<option value="">Todas</option>' +
        unidades.map(u => `<option>${u}</option>`).join('');
    }
  })();

  applyRoleRestrictions();
  applyFilters();
  setInterval(() => applyFilters(), 3000);

  if (typeof BroadcastChannel !== 'undefined') {
    const ch = new BroadcastChannel('crm_atividades');
    ch.onmessage = (e) => {
      if (e.data && e.data.type === 'nova_atividade' && e.data.log) {
        localStorage.setItem('crm_atividades', JSON.stringify(e.data.log));
        applyFilters();
      }
    };
  }

  // Atualiza select de unidades automaticamente quando crm_empresas mudar em outra aba
  window.addEventListener('storage', e => {
    if (e.key === 'crm_empresas') {
      let empresasLS = [];
      try { empresasLS = (JSON.parse(localStorage.getItem('crm_empresas') || '[]')).filter(e => !e.excluido); } catch {}
      const unidades = [...new Set(empresasLS.map(emp => emp.unidade).filter(Boolean))].sort();
      const sel = document.getElementById('filterUnit');
      if (sel) {
        const cur = sel.value;
        sel.innerHTML = '<option value="">Todas</option>' +
          unidades.map(u => `<option${u === cur ? ' selected' : ''}>${u}</option>`).join('');
      }
    }
  });
})();
