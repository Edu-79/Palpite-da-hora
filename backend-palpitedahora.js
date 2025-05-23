// BACKEND ATUALIZADO - PALPITES, HORÁRIOS E ESCUDOS
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_KEY = "92e0f4a7bea9a8f54c55e1353c9d53be";
const BASE_URL = "https://v3.football.api-sports.io";
const logoPadrao = "https://upload.wikimedia.org/wikipedia/commons/6/6e/Football_2.png";

async function gerarPalpites(homeId, awayId, leagueId) {
  try {
    const [homeStats, awayStats] = await Promise.all([
      axios.get(`${BASE_URL}/teams/statistics`, {
        params: { team: homeId, league: leagueId, season: 2023 },
        headers: { "x-apisports-key": API_KEY }
      }),
      axios.get(`${BASE_URL}/teams/statistics`, {
        params: { team: awayId, league: leagueId, season: 2023 },
        headers: { "x-apisports-key": API_KEY }
      })
    ]);

    const casa = homeStats.data.response;
    const fora = awayStats.data.response;

    const palpites = [];

    // Resultado provável
    const winRateCasa = casa.fixtures.wins.total / (casa.fixtures.played.total || 1);
    const winRateFora = fora.fixtures.wins.total / (fora.fixtures.played.total || 1);
    const empateRate = casa.fixtures.draws.total + fora.fixtures.draws.total;

    if (Math.abs(winRateCasa - winRateFora) < 0.1 && empateRate > casa.fixtures.played.total * 0.3) {
      palpites.push("Empate provável");
    } else if (winRateCasa > winRateFora) {
      palpites.push("Vitória do mandante");
    } else {
      palpites.push("Vitória do visitante");
    }

    // Gols
    const golsCasa = casa.goals.for.total.total / (casa.fixtures.played.total || 1);
    const golsFora = fora.goals.for.total.total / (fora.fixtures.played.total || 1);
    const mediaGols = (golsCasa + golsFora) / 2;
    if (mediaGols >= 2.5) {
      palpites.push("Mais de 2.5 gols");
    } else {
      palpites.push("Menos de 2.5 gols");
    }

    // Ambas marcam
    const sofreCasa = casa.goals.against.total.total / casa.fixtures.played.total;
    const sofreFora = fora.goals.against.total.total / fora.fixtures.played.total;
    if (sofreCasa > 1 && sofreFora > 1) {
      palpites.push("Ambas marcam");
    }

    // Escanteios e Cartões (simulados por enquanto)
    const escanteios = (casa.offsides?.total || 4) + (fora.offsides?.total || 4);
    const cartoes = (casa.cards.yellow.total || 2) + (fora.cards.yellow.total || 2);
    if (escanteios >= 8) {
      palpites.push("Mais de 8 escanteios");
    }
    if (cartoes >= 4) {
      palpites.push("Jogo com muitos cartões");
    }

    return palpites.slice(0, 4);
  } catch (err) {
    console.error("Erro ao gerar palpites:", {
      message: err.message,
      response: err.response?.data,
      team: { homeId, awayId, leagueId }
    });
    return ["Palpite indisponível"];
  }
}

app.get("/jogos", async (req, res) => {
  const hoje = new Date().toISOString().split("T")[0];
  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      params: { date: hoje },
      headers: { "x-apisports-key": API_KEY }
    });

    const jogos = await Promise.all(response.data.response.map(async jogo => {
      const palpites = await gerarPalpites(
        jogo.teams.home.id,
        jogo.teams.away.id,
        jogo.league.id
      );

      return {
        liga: jogo.league.name,
        ligaLogo: jogo.league.logo || logoPadrao,
        timeCasa: jogo.teams.home.name,
        escudoCasa: jogo.teams.home.logo || logoPadrao,
        timeFora: jogo.teams.away.name,
        escudoFora: jogo.teams.away.logo || logoPadrao,
        horario: new Date(new Date(jogo.fixture.date).getTime() - 3 * 60 * 60 * 1000)
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        palpites
      };
    }));

    res.json(jogos);
  } catch (err) {
    console.error("Erro ao buscar jogos:", err.message);
    res.status(500).json({ erro: "Erro ao buscar os jogos do dia" });
  }
});

app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
