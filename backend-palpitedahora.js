// Backend para o app Palpite da Hora usando Express.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_FOOTBALL_KEY = "92e0f4a7bea9a8f54c55e1353c9d53be";
const API_FOOTBALL_URL = "https://v3.football.api-sports.io";
const LOGO_PADRAO = "https://upload.wikimedia.org/wikipedia/commons/6/6e/Football_2.png";

app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const fixturesRes = await axios.get(`${API_FOOTBALL_URL}/fixtures?date=${hoje}`, {
      headers: { "x-apisports-key": API_FOOTBALL_KEY },
    });

    const jogos = fixturesRes.data.response;
    const ligasAgrupadas = {};

    for (const jogo of jogos) {
      const ligaNome = jogo.league.name;
      if (!ligasAgrupadas[ligaNome]) {
        ligasAgrupadas[ligaNome] = {
          liga: ligaNome,
          ligaLogo: jogo.league.logo || LOGO_PADRAO,
          jogos: []
        };
      }

      // Palpites com base em head-to-head
      const h2hURL = `${API_FOOTBALL_URL}/fixtures/headtohead?h2h=${jogo.teams.home.id}-${jogo.teams.away.id}`;
      let palpites = [];
      try {
        const h2hRes = await axios.get(h2hURL, {
          headers: { "x-apisports-key": API_FOOTBALL_KEY }
        });
        const confrontos = h2hRes.data.response;

        let vCasa = 0, vFora = 0, empates = 0, totalGols = 0;
        for (const partida of confrontos) {
          if (partida.teams.home.winner) vCasa++;
          else if (partida.teams.away.winner) vFora++;
          else empates++;
          totalGols += partida.goals.home + partida.goals.away;
        }

        const mediaGols = confrontos.length ? totalGols / confrontos.length : 0;
        const nomeCasa = jogo.teams.home.name;
        const nomeFora = jogo.teams.away.name;

        if (vCasa > vFora + 1) palpites.push(`Vitória do ${nomeCasa}`);
        if (vFora > vCasa + 1) palpites.push(`Vitória do ${nomeFora}`);
        if (empates > Math.max(vCasa, vFora)) palpites.push("Empate provável");
        if (mediaGols > 2.5) palpites.push("Mais de 2,5 gols");
        else palpites.push("Menos de 2,5 gols");
        if (confrontos.length >= 3) palpites.push("Ambas marcam");
        palpites = palpites.slice(0, 3);
      } catch {
        palpites = ["Palpite indisponível"];
      }

      ligasAgrupadas[ligaNome].jogos.push({
        horario: jogo.fixture.date.slice(11, 16),
        timeCasa: jogo.teams.home.name,
        escudoCasa: jogo.teams.home.logo || LOGO_PADRAO,
        timeFora: jogo.teams.away.name,
        escudoFora: jogo.teams.away.logo || LOGO_PADRAO,
        palpites
      });
    }

    const resultado = Object.values(ligasAgrupadas);
    res.json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: "Erro ao buscar jogos", detalhes: erro.message });
  }
});

app.get("/", (req, res) => {
  res.send("Backend Palpite da Hora em execução.");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
