document.addEventListener("DOMContentLoaded", () => {
  carregarDados();
});

let pessoas = {};

async function carregarDados() {
  const agenda = await fetch("agenda.txt?v=" + new Date().getTime()).then(r => r.text());
  pessoas = await fetch("data/pessoas.json").then(r => r.json());
  gerarCalendario(agenda);
}

function gerarCalendario(texto) {

  const linhas = texto.split("\n").map(l => l.trim()).filter(l => l);

  const container = document.querySelector(".calendar");
  container.innerHTML = "";

  let ano = "";
  let mesAtual = "";
  let eventosPorMes = {};

  linhas.forEach(linha => {

    if (/^\d{4}$/.test(linha)) {
      ano = linha;
      return;
    }

    if (!linha.includes("/")) {
      mesAtual = linha;
      if (!eventosPorMes[mesAtual]) eventosPorMes[mesAtual] = [];
      return;
    }

    let tipo = "principal";

    if (linha.startsWith("Evento:")) {
      tipo = "evento";
      linha = linha.replace("Evento:", "").trim();
    }

    if (linha.startsWith("Exceção:")) {
      tipo = "excecao";
      linha = linha.replace("Exceção:", "").trim();
    }

    const partes = linha.split("–");
    const dataTexto = partes[0].trim();
    const titulo = partes.slice(1).join("–").trim();

    const dia = dataTexto.split("/")[0];

    eventosPorMes[mesAtual].push({ dia, titulo, tipo });
  });

  Object.keys(eventosPorMes).forEach(mes => {

    const blocoMes = document.createElement("div");
    blocoMes.classList.add("month-block");

    const tituloMes = document.createElement("h2");
    tituloMes.innerText = mes;
    blocoMes.appendChild(tituloMes);

    eventosPorMes[mes].forEach(evento => {

      const div = document.createElement("div");
      div.classList.add("event");
      if (evento.tipo !== "principal") div.classList.add(evento.tipo);

      const nomeMatch = evento.titulo.match(/@(\w+)/);
      let nome = nomeMatch ? nomeMatch[1] : null;

      let fotoHTML = "";

      if (nome && pessoas[nome]) {
        fotoHTML = `<img src="${pessoas[nome].foto}" class="avatar" onclick="abrirModal('${nome}')">`;
      }

      div.innerHTML = `
        <div class="date">${evento.dia}</div>
        ${fotoHTML}
        <div class="info">${evento.titulo}</div>
      `;

      blocoMes.appendChild(div);
    });

    container.appendChild(blocoMes);
  });
}

function abrirModal(nome) {

  const pessoa = pessoas[nome];

  document.getElementById("modal-foto").src = pessoa.foto;
  document.getElementById("modal-nome").innerText = nome;
  document.getElementById("modal-cargo").innerText = pessoa.cargo;
  document.getElementById("modal-desc").innerText = pessoa.descricao;

  document.getElementById("modal").classList.add("active");
}

document.getElementById("modal").addEventListener("click", () => {
  document.getElementById("modal").classList.remove("active");
});
