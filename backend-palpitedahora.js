const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

const API_KEY = "92e0f4a7bea9a8f54c55e1353c9d53be";
const BASE_URL = "https://v3.football.api-sports.io";
const logoPadrao = "https://upload.wikimedia.org/wikipedia/commons/6/6e/Football_2.png";

const anoAtual = new Date().getFullYear();

async function gerarPalpites(homeId, awayId, leagueId) {
  try {
    const [homeStats, awayStats] = await Promise.all([
      axios.get(`${BASE_URL}/teams/statistics?team=${homeId}&league=${leagueId}&season=${anoAtual}`, {
        headers: { "x-apisports-key": API_KEY }
      }),
      axios.get(`${BASE_URL}/teams/statistics?team=${awayId}&league=${leagueId}&season=${anoAtual}`, {
        headers: { "x-apisports-key": API_KEY }
      })
    ]);

    const homeForm = homeStats.data.response.form || "";
    const awayForm = awayStats.data.response.form || "";
    const homeWins = (homeForm.match(/W/g) || []).length;
    const awayWins = (awayForm.match(/W/g) || []).length;

    const palpitePrincipal = homeWins > awayWins + 1
      ? `Vitória do ${homeStats.data.response.team.name}`
      : awayWins > homeWins + 1
        ? `Vitória do ${awayStats.data.response.team.name}`
        : "Empate provável";

    const mediaGols = homeStats.data.response.goals.for.average.total + awayStats.data.response.goals.for.average.total;
    const palpiteGols = mediaGols > 2.5 ? "Mais de 2.5 gols" : "Menos de 2.5 gols";

    const ambasMarcam = homeStats.data.response.clean_sheet.home < 3 && awayStats.data.response.clean_sheet.away < 3;

    const escanteios = homeStats.data.response.lineups.length >= 3 ? "Mais de 4 escanteios" : null;

    const palpites = [palpitePrincipal, palpiteGols];
    if (ambasMarcam) palpites.push("Ambas marcam");
    if (escanteios) palpites.push(escanteios);

    return palpites;
  } catch (err) {
    console.error("Erro ao gerar palpites:", err.message);
    return ["Palpite indisponível"];
  }
}

app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const resposta = await axios.get(`${BASE_URL}/fixtures?date=${hoje}`, {
      headers: { "x-apisports-key": API_KEY }
    });

    const jogos = await Promise.all(resposta.data.response.slice(0, 10).map(async jogo => {
      const home = jogo.teams.home;
      const away = jogo.teams.away;
      const league = jogo.league;
      const hora = jogo.fixture.date.slice(11, 16);
      const palpites = await gerarPalpites(home.id, away.id, league.id);

      return {
        liga: league.name,
        ligaLogo: league.logo || logoPadrao,
        timeCasa: home.name,
        escudoCasa: home.logo || logoPadrao,
        timeFora: away.name,
        escudoFora: away.logo || logoPadrao,
        horario: hora,
        palpites
      };
    }));

    res.json(jogos);
  } catch (err) {
    console.error("Erro ao buscar dados:", err.message);
    res.status(500).json({ erro: "Erro ao buscar jogos" });
  }
});

app.listen(PORT, () => console.log("Servidor com API-Football ativo na porta " + PORT));
