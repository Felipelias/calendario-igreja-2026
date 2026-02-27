document.addEventListener("DOMContentLoaded", () => {

  const texto = `
2026

MARÇO

05/03 - Reunião geral de liderança
12/03 - Reunião Ministério de Louvor
06/03 - Vigília pré Santa Ceia
19/03 - Reunião do diaconato
27/03
26/04 - Louvor com as Crianças no altar
`;

  gerarCalendario(texto);
});

function gerarCalendario(texto) {

  const linhas = texto.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const container = document.querySelector(".calendar");
  container.innerHTML = "";

  const ano = linhas[0];
  document.querySelector(".subtitle").innerText =
    "CALENDÁRIO ANUAL " + ano;

  let blocoMes = null;

  linhas.slice(1).forEach(linha => {

    if (!/^\d{2}\//.test(linha)) {

      blocoMes = document.createElement("div");
      blocoMes.classList.add("month-block");

      const tituloMes = document.createElement("h2");
      tituloMes.classList.add("month-title");
      tituloMes.innerText = linha;

      blocoMes.appendChild(tituloMes);
      container.appendChild(blocoMes);

    } else {

      const partes = linha.split(" - ");
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

