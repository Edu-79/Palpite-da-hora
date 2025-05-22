// backend corrigido com estatísticas reais e escudos
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_KEY = "acbb8110aa46345c241f0562f3a0e24d";
const BASE_URL = "https://v3.football.api-sports.io";

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

    const homeWinRate = casa.fixtures.wins.total / (casa.fixtures.played.total || 1);
    const awayWinRate = fora.fixtures.wins.total / (fora.fixtures.played.total || 1);
    const homeGoals = casa.goals.for.total.total / (casa.fixtures.played.total || 1);
    const awayGoals = fora.goals.for.total.total / (fora.fixtures.played.total || 1);

    const palpites = [];

    if (homeWinRate > awayWinRate + 0.2) {
      palpites.push("Vitória do mandante");
    } else if (awayWinRate > homeWinRate + 0.2) {
      palpites.push("Vitória do visitante");
    } else {
      palpites.push("Empate provável");
    }

    if ((homeGoals + awayGoals) / 2 > 2.2) {
      palpites.push("Mais de 2.5 gols");
    } else {
      palpites.push("Menos de 2.5 gols");
    }

    if ((casa.goals.against.total.total / casa.fixtures.played.total > 1) &&
        (fora.goals.against.total.total / fora.fixtures.played.total > 1)) {
      palpites.push("Ambas marcam");
    }

    return palpites.slice(0, 3);
  } catch (err) {
    console.error("Erro ao gerar palpites:", err.message);
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
        ligaLogo: jogo.league.logo,
        timeCasa: jogo.teams.home.name,
        escudoCasa: jogo.teams.home.logo,
        timeFora: jogo.teams.away.name,
        escudoFora: jogo.teams.away.logo,
        horario: new Date(jogo.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
