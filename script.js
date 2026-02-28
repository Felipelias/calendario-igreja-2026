document.addEventListener("DOMContentLoaded", () => {
  iniciar();
});

let pessoas = {};

async function iniciar() {
  try {
    const [agendaTxt, pessoasJson] = await Promise.all([
      fetch("agenda.txt?v=" + Date.now()).then(r => r.text()),
      fetch("data/pessoas.json?v=" + Date.now()).then(r => r.json())
    ]);

    pessoas = pessoasJson || {};
    gerarCalendario(agendaTxt || "");
  } catch (e) {
    console.error(e);
    const container = document.querySelector(".calendar");
    if (container) container.innerHTML = "<p style='opacity:.8'>Não foi possível carregar a agenda.</p>";
  }
}

function gerarCalendario(texto) {
  const linhas = texto.split("\n").map(l => l.trim()).filter(Boolean);
  const container = document.querySelector(".calendar");
  container.innerHTML = "";

  let anoAtual = "";
  let mesAtual = "";
  const dados = {};

  for (const original of linhas) {
    let linha = original;

    if (/^\d{4}$/.test(linha)) {
      anoAtual = linha;
      if (!dados[anoAtual]) dados[anoAtual] = {};
      continue;
    }

    if (!anoAtual) continue;

    const temData = /(\d{2})\/(\d{2})(?:\s*a\s*(\d{2})\/(\d{2}))?/.test(linha);

    if (!temData) {
      mesAtual = linha;
      if (!dados[anoAtual][mesAtual]) dados[anoAtual][mesAtual] = [];
      continue;
    }

    if (!mesAtual) continue;

    let tipo = "principal";
    const lower = linha.toLowerCase();

    if (lower.startsWith("evento:")) {
      tipo = "evento";
      linha = linha.slice(7).trim();
    } else if (lower.startsWith("exceção:") || lower.startsWith("excecao:")) {
      tipo = "excecao";
      linha = linha.split(":").slice(1).join(":").trim();
    }

    const m = linha.match(/(\d{2})\/(\d{2})(?:\s*a\s*(\d{2})\/(\d{2}))?/);
    if (!m) continue;

    const d1 = m[1];
    const d2 = m[3];
    let dataExibir = d1;
    if (d2) dataExibir = `${d1}-${d2}`;

    let resto = linha.replace(m[0], "").trim();
    resto = resto.replace(/^[–\-]\s*/, "");
    resto = resto.replace(/\s{2,}/g, " ").trim();

    const nomeMatch = resto.match(/@([A-Za-zÀ-ÿ0-9_]+)/);
    const nome = nomeMatch ? nomeMatch[1] : null;

    let textoLimpo = resto.replace(/@([A-Za-zÀ-ÿ0-9_]+)/, "").trim();
    textoLimpo = textoLimpo.replace(/\s{2,}/g, " ").trim();

    dados[anoAtual][mesAtual].push({ dataExibir, texto: textoLimpo, tipo, nome });
  }

  const anos = Object.keys(dados);
  if (anos.length === 0) return;

  anos.forEach(ano => {
    const meses = dados[ano];
    Object.keys(meses).forEach(mes => {
      if (!meses[mes] || meses[mes].length === 0) return;

      const blocoMes = document.createElement("div");
      blocoMes.className = "month-block";

      const h2 = document.createElement("h2");
      h2.textContent = mes;
      blocoMes.appendChild(h2);

      meses[mes].forEach(ev => {
        const div = document.createElement("div");
        div.className = "event";
        if (ev.tipo !== "principal") div.classList.add(ev.tipo);

        let avatarHTML = "";
        if (ev.nome && pessoas[ev.nome] && pessoas[ev.nome].foto) {
          avatarHTML = `<img class="avatar" src="${pessoas[ev.nome].foto}" alt="${ev.nome}">`;
        } else if (ev.nome) {
          const ini = ev.nome.trim().charAt(0).toUpperCase();
          avatarHTML = `<div class="avatar fallback" aria-hidden="true">${ini}</div>`;
        } else {
          avatarHTML = `<div class="avatar ghost" aria-hidden="true"></div>`;
        }

        div.innerHTML = `
          <div class="date">${ev.dataExibir}</div>
          ${avatarHTML}
          <div class="info">${ev.texto}</div>
        `;

        if (ev.nome && pessoas[ev.nome]) {
          div.addEventListener("click", () => abrirModal(ev.nome));
        }

        blocoMes.appendChild(div);
      });

      container.appendChild(blocoMes);
    });
  });
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
