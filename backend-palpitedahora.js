// BACKEND COM FOOTBALL-DATA.ORG
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

const API_KEY = "82b83859abf946758b0ebf4e6eeb5e0d";
const BASE_URL = "https://api.football-data.org/v4";
const logoPadrao = "https://upload.wikimedia.org/wikipedia/commons/6/6e/Football_2.png";

app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().split("T")[0];
    const response = await axios.get(`${BASE_URL}/matches?dateFrom=${hoje}&dateTo=${hoje}`, {
      headers: { "X-Auth-Token": API_KEY }
    });

    const partidas = response.data.matches || [];
    const jogos = partidas.slice(0, 10).map(jogo => {
      return {
        liga: jogo.competition.name,
        ligaLogo: logoPadrao,
        timeCasa: jogo.homeTeam.name,
        escudoCasa: logoPadrao,
        timeFora: jogo.awayTeam.name,
        escudoFora: logoPadrao,
        horario: new Date(jogo.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        palpites: [
          "Empate provável",
          `Vitória de ${jogo.homeTeam.name}`,
          `Menos de 2.5 gols`
        ]
      };
    });

    res.json(jogos);
  } catch (err) {
    console.error("Erro ao buscar dados do Football-Data.org:", err.message);
    if (err.response) console.error("Detalhes:", err.response.data);
    res.status(500).json({ erro: "Erro ao buscar jogos" });
  }
});

app.listen(PORT, () => console.log("Servidor Football-Data rodando na porta " + PORT));
