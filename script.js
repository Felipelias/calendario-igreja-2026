document.addEventListener("DOMContentLoaded", () => {
  iniciar();
});

let pessoas = {};
let agendaEstruturada = null;
let filtroAtual = null;

const MESES_MAP = {
  "JANEIRO": 1, "FEVEREIRO": 2, "MARÇO": 3, "MARCO": 3, "ABRIL": 4,
  "MAIO": 5, "JUNHO": 6, "JULHO": 7, "AGOSTO": 8, "SETEMBRO": 9,
  "OUTUBRO": 10, "NOVEMBRO": 11, "DEZEMBRO": 12
};

async function iniciar() {
  try {
    const [agendaTxt, pessoasJson] = await Promise.all([
      fetch("agenda.txt?v=" + Date.now()).then(r => r.text()),
      fetch("data/pessoas.json?v=" + Date.now()).then(r => r.json())
    ]);

    pessoas = pessoasJson || {};
    agendaEstruturada = parseAgenda(agendaTxt || "");
    render();

    const backbtn = document.getElementById("backbtn");
    backbtn.addEventListener("click", () => {
      filtroAtual = null;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  } catch (e) {
    console.error(e);
    const container = document.getElementById("calendar");
    if (container) container.innerHTML = "<p style='opacity:.8'>Não foi possível carregar a agenda.</p>";
  }
}

function normalizarMes(m) {
  const up = (m || "").toUpperCase().trim();
  if (MESES_MAP[up]) return up;
  return up;
}

function isAno(linha) {
  return /^\d{4}$/.test((linha || "").trim());
}

function extrairData(linha) {
  const m = (linha || "").match(/(\d{2})\/(\d{2})(?:\s*a\s*(\d{2})\/(\d{2}))?/i);
  if (!m) return null;
  return { d1: m[1], m1: m[2], d2: m[3] || null, m2: m[4] || null, raw: m[0] };
}

function formatarDiaExibir(d1, d2) {
  if (d2) return `${d1} a ${d2}`;
  return d1;
}

function limparSeparadores(txt) {
  return (txt || "")
    .replace(/^[–\-]\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function detectarNomePreletor(texto) {
  const t = (texto || "").trim();

  const mAt = t.match(/@([A-Za-zÀ-ÿ0-9_]+)/);
  if (mAt && pessoas[mAt[1]]) return mAt[1];

  const partes = t.split(/[–\-|]/).map(p => p.trim()).filter(Boolean);
  for (let i = partes.length - 1; i >= 0; i--) {
    const candidato = partes[i];
    if (pessoas[candidato]) return candidato;
  }

  return null;
}

function extrairTemaPregacao(texto) {
  const m = (texto || "").match(/\bTema:\s*(.+)$/i);
  if (!m) return null;
  return m[1].trim();
}

function removerTema(texto) {
  return (texto || "").replace(/\bTema:\s*.+$/i, "").trim();
}

function removerNomeDoTexto(texto, nome) {
  let t = texto || "";
  t = t.replace(/@([A-Za-zÀ-ÿ0-9_]+)/, "").trim();
  if (nome) {
    const re = new RegExp(`\\b${escapeRegExp(nome)}\\b\\s*$`);
    t = t.replace(re, "").trim();
  }
  t = t.replace(/[–\-|]\s*$/, "").trim();
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}

function escapeRegExp(s) {
  return (s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseAgenda(txt) {
  const linhas = (txt || "").split("\n").map(l => l.trim()).filter(Boolean);

  const estrutura = {
    anos: {}
  };

  let anoAtual = "";
  let mesAtual = "";
  let temaMesAtual = null;

  for (const original of linhas) {
    let linha = original;

    if (isAno(linha)) {
      anoAtual = linha;
      if (!estrutura.anos[anoAtual]) estrutura.anos[anoAtual] = { meses: {} };
      mesAtual = "";
      temaMesAtual = null;
      continue;
    }

    if (!anoAtual) continue;

    const data = extrairData(linha);

    if (!data) {
      const low = linha.toLowerCase();

      if (low.startsWith("série:") || low.startsWith("serie:") || low.startsWith("tema do mês:") || low.startsWith("tema do mes:")) {
        temaMesAtual = linha.split(":").slice(1).join(":").trim();
        if (mesAtual) {
          estrutura.anos[anoAtual].meses[mesAtual].temaMes = temaMesAtual;
        }
        continue;
      }

      mesAtual = normalizarMes(linha);
      if (!estrutura.anos[anoAtual].meses[mesAtual]) {
        estrutura.anos[anoAtual].meses[mesAtual] = { temaMes: temaMesAtual, dias: {} };
      } else {
        estrutura.anos[anoAtual].meses[mesAtual].temaMes = estrutura.anos[anoAtual].meses[mesAtual].temaMes || temaMesAtual;
      }
      continue;
    }

    if (!mesAtual) continue;

    const lower = linha.toLowerCase();
    let tipo = "principal";
    if (lower.startsWith("extra:")) {
      tipo = "extra";
      linha = linha.split(":").slice(1).join(":").trim();
    } else if (lower.startsWith("atenção:") || lower.startsWith("atencao:")) {
      tipo = "alerta";
      linha = linha.split(":").slice(1).join(":").trim();
    } else if (lower.startsWith("evento:")) {
      tipo = "extra";
      linha = linha.split(":").slice(1).join(":").trim();
    } else if (lower.startsWith("exceção:") || lower.startsWith("excecao:")) {
      tipo = "alerta";
      linha = linha.split(":").slice(1).join(":").trim();
    }

    const d = extrairData(linha);
    if (!d) continue;

    const diaExibir = formatarDiaExibir(d.d1, d.d2);
    const chaveDia = diaExibir;

    let resto = limparSeparadores(linha.replace(d.raw, "").trim());

    const tema = extrairTemaPregacao(resto);
    resto = removerTema(resto);

    const nome = detectarNomePreletor(resto);

    const textoLimpo = removerNomeDoTexto(resto, nome);

    const mesObj = estrutura.anos[anoAtual].meses[mesAtual];
    if (!mesObj.dias[chaveDia]) {
      mesObj.dias[chaveDia] = {
        dia: chaveDia,
        principal: null,
        extras: [],
        alertas: [],
        nomePrincipal: null,
        temaPregacao: null
      };
    }

    const diaObj = mesObj.dias[chaveDia];

    if (tipo === "principal") {
      if (!diaObj.principal) {
        diaObj.principal = textoLimpo || "Culto";
        diaObj.nomePrincipal = nome || null;
        diaObj.temaPregacao = tema || null;
      } else {
        diaObj.extras.push(textoLimpo);
      }
    } else if (tipo === "extra") {
      diaObj.extras.push(textoLimpo);
    } else {
      diaObj.alertas.push(textoLimpo);
    }
  }

  return estrutura;
}

function render() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  const filterbar = document.getElementById("filterbar");
  const filtertitle = document.getElementById("filtertitle");

  if (!agendaEstruturada) return;

  if (filtroAtual) {
    filterbar.classList.add("active");
    filtertitle.textContent = `Pregações de ${filtroAtual}`;
    renderFiltradoPorPreletor(cal, filtroAtual);
    return;
  }

  filterbar.classList.remove("active");
  filtertitle.textContent = "";

  renderCompleto(cal);
}

function renderCompleto(root) {
  const anos = Object.keys(agendaEstruturada.anos).sort((a, b) => Number(a) - Number(b));

  for (const ano of anos) {
    const anoObj = agendaEstruturada.anos[ano];
    const meses = Object.keys(anoObj.meses);

    if (meses.length === 0) continue;

    const yearTitle = document.createElement("div");
    yearTitle.className = "year-title";
    yearTitle.textContent = ano;
    root.appendChild(yearTitle);

    const mesesOrdenados = meses.sort((a, b) => (MESES_MAP[a] || 99) - (MESES_MAP[b] || 99));
    for (const mes of mesesOrdenados) {
      const mesObj = anoObj.meses[mes];
      const dias = Object.values(mesObj.dias);
      if (dias.length === 0) continue;

      const bloco = document.createElement("section");
      bloco.className = "month-block";

      const head = document.createElement("div");
      head.className = "month-head";

      const nomeMes = document.createElement("div");
      nomeMes.className = "month-name";
      nomeMes.textContent = mes;

      head.appendChild(nomeMes);

      if (mesObj.temaMes) {
        const tag = document.createElement("div");
        tag.className = "month-tag";
        tag.textContent = mesObj.temaMes;
        head.appendChild(tag);
      }

      bloco.appendChild(head);

      dias.sort((a, b) => ordenarDia(a.dia, b.dia));

      for (const diaObj of dias) {
        bloco.appendChild(criarCardDia(ano, mes, diaObj));
      }

      root.appendChild(bloco);
    }
  }
}

function renderFiltradoPorPreletor(root, nome) {
  const itens = [];

  const anos = Object.keys(agendaEstruturada.anos).sort((a, b) => Number(a) - Number(b));
  for (const ano of anos) {
    const anoObj = agendaEstruturada.anos[ano];
    const meses = Object.keys(anoObj.meses).sort((a, b) => (MESES_MAP[a] || 99) - (MESES_MAP[b] || 99));

    for (const mes of meses) {
      const mesObj = anoObj.meses[mes];
      const dias = Object.values(mesObj.dias);

      for (const d of dias) {
        const hit = (d.nomePrincipal || "") === nome;
        if (hit) itens.push({ ano, mes, d, temaMes: mesObj.temaMes || null });
      }
    }
  }

  if (itens.length === 0) {
    const p = document.createElement("p");
    p.style.opacity = "0.85";
    p.style.textAlign = "center";
    p.style.marginTop = "18px";
    p.textContent = "Nenhuma data encontrada para esse preletor.";
    root.appendChild(p);
    return;
  }

  itens.sort((a, b) => {
    const aa = Number(a.ano) - Number(b.ano);
    if (aa !== 0) return aa;
    const mm = (MESES_MAP[a.mes] || 99) - (MESES_MAP[b.mes] || 99);
    if (mm !== 0) return mm;
    return ordenarDia(a.d.dia, b.d.dia);
  });

  let chaveAtual = "";
  for (const it of itens) {
    const chave = `${it.ano}-${it.mes}`;
    if (chave !== chaveAtual) {
      chaveAtual = chave;

      const bloco = document.createElement("section");
      bloco.className = "month-block";

      const head = document.createElement("div");
      head.className = "month-head";

      const nomeMes = document.createElement("div");
      nomeMes.className = "month-name";
      nomeMes.textContent = `${it.mes} • ${it.ano}`;

      head.appendChild(nomeMes);

      if (it.temaMes) {
        const tag = document.createElement("div");
        tag.className = "month-tag";
        tag.textContent = it.temaMes;
        head.appendChild(tag);
      }

      bloco.appendChild(head);
      bloco.dataset.k = chave;

      root.appendChild(bloco);
    }

    const blocoAtual = root.querySelector(`.month-block[data-k="${chaveAtual}"]`);
    blocoAtual.appendChild(criarCardDia(it.ano, it.mes, it.d, true));
  }
}

function ordenarDia(a, b) {
  const na = Number((a || "").split(" ")[0].split("-")[0]);
  const nb = Number((b || "").split(" ")[0].split("-")[0]);
  return na - nb;
}

function criarCardDia(ano, mes, diaObj, modoFiltrado = false) {
  const card = document.createElement("div");
  card.className = "day-card";

  const clicavel = !!diaObj.nomePrincipal && !!pessoas[diaObj.nomePrincipal];
  if (clicavel) card.classList.add("clickable");

  const date = document.createElement("div");
  date.className = "day-date";
  date.textContent = diaObj.dia;

  const avatarEl = criarAvatar(diaObj.nomePrincipal);

  const content = document.createElement("div");
  content.className = "content";

  const main = document.createElement("div");
  main.className = "line-main";
  const preletorTxt = diaObj.nomePrincipal ? ` • ${diaObj.nomePrincipal}` : "";
  main.textContent = `${diaObj.principal || ""}${preletorTxt}`;

  content.appendChild(main);

  if (diaObj.temaPregacao) {
    const theme = document.createElement("div");
    theme.className = "theme-pill";
    theme.innerHTML = `<i class="ri-book-open-line"></i> ${diaObj.temaPregacao}`;
    content.appendChild(theme);
  }

  if (diaObj.extras && diaObj.extras.length) {
    for (const ex of diaObj.extras) {
      const e = document.createElement("div");
      e.className = "line-extra";
      e.textContent = ex;
      content.appendChild(e);
    }
  }

  if (diaObj.alertas && diaObj.alertas.length) {
    for (const al of diaObj.alertas) {
      const a = document.createElement("div");
      a.className = "line-alert";
      a.textContent = al;
      content.appendChild(a);
    }
  }

  card.appendChild(date);
  card.appendChild(avatarEl);
  card.appendChild(content);

  if (clicavel) {
    card.addEventListener("click", () => {
      filtroAtual = diaObj.nomePrincipal;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return card;
}

function criarAvatar(nome) {
  if (nome && pessoas[nome] && pessoas[nome].foto) {
    const img = document.createElement("img");
    img.className = "avatar";
    img.src = pessoas[nome].foto;
    img.alt = nome;

    img.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirModal(nome);
    });

    return img;
  }

  const div = document.createElement("div");
  div.className = "avatar fallback";
  div.textContent = nome ? nome.trim().charAt(0).toUpperCase() : "•";

  if (nome && pessoas[nome]) {
    div.style.cursor = "pointer";
    div.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirModal(nome);
    });
  } else {
    div.style.opacity = "0.4";
  }

  return div;
}

function abrirModal(nome) {
  const pessoa = pessoas[nome];
  if (!pessoa) return;

  const modal = document.getElementById("modal");
  document.getElementById("modal-foto").src = pessoa.foto || "";
  document.getElementById("modal-nome").textContent = nome;
  document.getElementById("modal-cargo").textContent = pessoa.cargo || "";
  document.getElementById("modal-desc").textContent = pessoa.descricao || "";

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

document.addEventListener("click", (e) => {
  const modal = document.getElementById("modal");
  if (!modal || !modal.classList.contains("active")) return;

  const card = modal.querySelector(".modal-card");
  if (card && !card.contains(e.target)) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
});
