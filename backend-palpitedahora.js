// BACKEND MODO LEVE - APENAS VISUALIZAÇÃO TEMPORÁRIA
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_KEY = "92e0f4a7bea9a8f54c55e1353c9d53be";
const BASE_URL = "https://v3.football.api-sports.io";
const logoPadrao = "https://upload.wikimedia.org/wikipedia/commons/6/6e/Football_2.png";

app.get("/jogos", async (req, res) => {
  const hoje = new Date().toISOString().split("T")[0];
  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      params: { date: hoje },
      headers: { "x-apisports-key": API_KEY }
    });

    const jogos = response.data.response.slice(0, 10).map(jogo => {
      return {
        liga: jogo.league.name,
        ligaLogo: jogo.league.logo || logoPadrao,
        timeCasa: jogo.teams.home.name,
        escudoCasa: jogo.teams.home.logo || logoPadrao,
        timeFora: jogo.teams.away.name,
        escudoFora: jogo.teams.away.logo || logoPadrao,
        horario: new Date(new Date(jogo.fixture.date).getTime() - 3 * 60 * 60 * 1000)
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        palpites: ["Palpite oculto (modo visualização)"]
      };
    });

    res.json(jogos);
  } catch (err) {
    console.error("Erro ao buscar jogos:", err.message);
    res.status(500).json({ erro: "Erro ao buscar os jogos do dia" });
  }
});

app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
