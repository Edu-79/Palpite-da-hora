// BACKEND COMPLETO PARA "PALPITE DA HORA"
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_KEY = "92e0f4a7bea9a8f54c55e1353c9d53be";
const API_URL = "https://v3.football.api-sports.io";

app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10); // formato YYYY-MM-DD

    const response = await axios.get(`${API_URL}/fixtures`, {
      params: { date: hoje },
      headers: {
        "x-apisports-key": API_KEY,
      },
    });

    const jogosBrutos = response.data.response;

    const jogosFormatados = jogosBrutos.map(jogo => {
      return {
        liga: jogo.league.name,
        ligaLogo: jogo.league.logo,
        pais: jogo.league.country,
        horario: jogo.fixture.date,
        escudoCasa: jogo.teams.home.logo,
        escudoFora: jogo.teams.away.logo,
        timeCasa: jogo.teams.home.name,
        timeFora: jogo.teams.away.name,
        palpites: gerarPalpitesAleatorios()
      };
    });

    res.json(jogosFormatados);

  } catch (error) {
    console.error("Erro ao buscar jogos:", error.message);
    res.status(500).json({ erro: "Erro ao buscar jogos do dia." });
  }
});

function gerarPalpitesAleatorios() {
  const opcoes = [
    "Mais de 2.5 gols",
    "Ambas marcam",
    "Vitória do mandante",
    "Vitória do visitante",
    "Empate",
    "Menos de 2.5 gols"
  ];

  // retorna 3 palpites aleatórios diferentes
  const embaralhado = opcoes.sort(() => 0.5 - Math.random());
  return embaralhado.slice(0, 3);
}

app.get("/", (req, res) => {
  res.send("API do Palpite da Hora funcionando!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
