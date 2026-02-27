document.addEventListener("DOMContentLoaded", () => {

  const raw = document.getElementById("agenda-data");

  if (!raw) {
    console.error("Bloco agenda-data não encontrado");
    return;
  }

  const texto = raw.textContent.trim();
  gerarCalendario(texto);
});

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

  let blocoMes = null;

  for (let i = 1; i < linhas.length; i++) {

    const linha = linhas[i];

    // Se começa com número → evento
    if (/^\d{2}\/\d{2}/.test(linha)) {

      const partes = linha.split(" - ");
      const dataTexto = partes[0];
      const titulo = partes.slice(1).join(" - ");

      const [dia, mes] = dataTexto.split("/").map(Number);

      if (ehSabado(dia, mes, ano)) {

        const eventoDiv = document.createElement("div");
        eventoDiv.classList.add("event");

        eventoDiv.innerHTML = `
          <div class="date">${dia}</div>
          <div class="info">${titulo}</div>
        `;

        if (blocoMes) {
          blocoMes.appendChild(eventoDiv);
        }
      }

    } else {
      // É mês
      blocoMes = document.createElement("div");
      blocoMes.classList.add("month-block");

      const tituloMes = document.createElement("h2");
      tituloMes.innerText = linha;

      blocoMes.appendChild(tituloMes);
      container.appendChild(blocoMes);
    }
  }
}
