// BACKEND USANDO FOOTBALL-DATA.ORG
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

const API_KEY = "X-Auth-Token"; // troque por sua chave real do Football-Data.org
const BASE_URL = "https://api.football-data.org/v4";
const logoPadrao = "https://upload.wikimedia.org/wikipedia/commons/6/6e/Football_2.png";

// Endpoint de teste com partidas das principais ligas
app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().split("T")[0];
    const response = await axios.get(`${BASE_URL}/matches?dateFrom=${hoje}&dateTo=${hoje}`, {
      headers: { "X-Auth-Token": "82b83859abf946758b0ebf4e6eeb5e0d" }
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
        palpites: ["Jogo disponível via Football-Data"]
      };
    });

    res.json(jogos);
  } catch (err) {
    console.error("Erro ao buscar dados no Football-Data.org:", err.message);
    res.status(500).json({ erro: "Erro ao buscar jogos" });
  }
});

app.listen(PORT, () => console.log("Servidor Football-Data rodando na porta " + PORT));
