document.addEventListener("DOMContentLoaded", () => {
  fetch("agenda.txt")
    .then(res => res.text())
    .then(texto => gerarCalendario(texto));
});

function gerarCalendario(texto) {

  const linhas = texto.split("\n")
    .map(l => l.trim())
    .filter(l => l !== "");

  const container = document.querySelector(".calendar");

  let ano = linhas[0];
  document.querySelector(".subtitle").innerText =
    "CALENDÁRIO ANUAL " + ano;

  let blocoMes = null;

  linhas.slice(1).forEach(linha => {

    if (!linha.includes("/") && !linha.includes("-")) {

      blocoMes = document.createElement("div");
      blocoMes.classList.add("month-block");

      const tituloMes = document.createElement("h2");
      tituloMes.classList.add("month-title");
      tituloMes.innerText = linha;

      blocoMes.appendChild(tituloMes);
      container.appendChild(blocoMes);

      return;
    }

    const partes = linha.split(" - ");
    if (partes.length >= 2) {

      const data = partes[0];
      const titulo = partes.slice(1).join(" - ");
      const dia = data.split("/")[0];

      const eventoDiv = document.createElement("div");
      eventoDiv.classList.add("event");

      eventoDiv.innerHTML = `
        <div class="date">${dia}</div>
        <div class="info">${titulo}</div>
      `;

      blocoMes.appendChild(eventoDiv);
    }
  });
}
