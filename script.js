document.addEventListener("DOMContentLoaded", () => {
  carregarAgenda();
});

async function carregarAgenda() {
  try {
    const response = await fetch("agenda.txt?v=" + new Date().getTime());
    const texto = await response.text();
    gerarCalendario(texto);
  } catch (erro) {
    console.error("Erro ao carregar agenda:", erro);
  }
}

function ehSabado(dia, mes, ano) {
  const data = new Date(ano, mes - 1, dia);
  return data.getDay() === 6;
}

function gerarCalendario(texto) {

  const linhas = texto.split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const container = document.querySelector(".calendar");
  container.innerHTML = "";

  const ano = parseInt(linhas[0]);
  document.querySelector(".subtitle").innerText =
    "CALENDÁRIO SÁBADOS " + ano;

  let mesAtual = "";
  let eventosPorMes = {};

  for (let i = 1; i < linhas.length; i++) {

    const linha = linhas[i];

    if (!/^\d{2}\/\d{2}/.test(linha)) {
      mesAtual = linha;
      eventosPorMes[mesAtual] = [];
    } else {

      const partes = linha.split(" - ");
      const dataTexto = partes[0];
      const titulo = partes.slice(1).join(" - ");

      const [dia, mes] = dataTexto.split("/").map(Number);

      if (ehSabado(dia, mes, ano)) {
        eventosPorMes[mesAtual].push({ dia, titulo });
      }
    }
  }

  Object.keys(eventosPorMes).forEach(mes => {

    if (eventosPorMes[mes].length === 0) return;

    eventosPorMes[mes].sort((a, b) => a.dia - b.dia);

    const blocoMes = document.createElement("div");
    blocoMes.classList.add("month-block");

    const tituloMes = document.createElement("h2");
    tituloMes.classList.add("month-title");
    tituloMes.innerText = mes;

    blocoMes.appendChild(tituloMes);

    eventosPorMes[mes].forEach(evento => {

      const eventoDiv = document.createElement("div");
      eventoDiv.classList.add("event");

      eventoDiv.innerHTML = `
        <div class="date">${evento.dia.toString().padStart(2, "0")}</div>
        <div class="info">${evento.titulo}</div>
      `;

      blocoMes.appendChild(eventoDiv);
    });

    container.appendChild(blocoMes);
  });
}
