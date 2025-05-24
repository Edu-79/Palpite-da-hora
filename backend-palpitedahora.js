const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

const API_KEY = "92e0f4a7bea9a8f54c55e1353c9d53be";
const BASE_URL = "https://v3.football.api-sports.io";

app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const resposta = await axios.get(`${BASE_URL}/fixtures?date=${hoje}`, {
      headers: {
        "x-apisports-key": API_KEY
      }
    });

    const jogos = resposta.data.response.map(jogo => {
      const home = jogo.teams.home;
      const away = jogo.teams.away;
      const league = jogo.league;
      const hora = jogo.fixture.date.slice(11, 16);

      return {
        liga: league.name,
        ligaLogo: league.logo,
        timeCasa: home.name,
        escudoCasa: home.logo,
        timeFora: away.name,
        escudoFora: away.logo,
        horario: hora,
        palpites: [
          `Vitória do ${home.name}`,
          `Empate provável`,
          `Ambas marcam`
        ]
      };
    });

    res.json(jogos.slice(0, 10));
  } catch (err) {
    console.error("Erro ao buscar dados:", err.message);
    res.status(500).json({ erro: "Erro ao buscar jogos" });
  }
});

app.listen(PORT, () => {
  console.log("Servidor com API-Football rodando na porta " + PORT);
});
