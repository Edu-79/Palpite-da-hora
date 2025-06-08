const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().split("T")[0]; // AAAA-MM-DD
    const jogosResp = await axios.get(`https://v3.football.api-sports.io/fixtures?date=${hoje}`, {
      headers: {
        "x-apisports-key": process.env.API_FOOTBALL_KEY,
      }
    });

    const jogos = jogosResp.data.response;

    const jogosFormatados = await Promise.all(jogos.map(async (jogo) => {
      const prompt = `Com base nas informações abaixo, gere 3 palpites coerentes de apostas para o jogo de hoje:
Time da casa: ${jogo.teams.home.name}
Time visitante: ${jogo.teams.away.name}
Campeonato: ${jogo.league.name}
Data: ${hoje}

Responda em formato de lista:`;

      try {
        const respIA = await axios.post("https://api.openai.com/v1/chat/completions", {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 100,
        }, {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        });

        const respostaIA = respIA.data.choices[0].message.content.trim().split("\n").map(p => p.replace(/^\d+[\.\)]\s*/, ""));

        return {
          liga: jogo.league.name,
          ligaLogo: jogo.league.logo,
          timeCasa: jogo.teams.home.name,
          escudoCasa: jogo.teams.home.logo,
          timeFora: jogo.teams.away.name,
          escudoFora: jogo.teams.away.logo,
          horario: jogo.fixture.date.slice(11, 16),
          palpites: respostaIA
        };
      } catch (erroIA) {
        return {
          liga: jogo.league.name,
          ligaLogo: jogo.league.logo,
          timeCasa: jogo.teams.home.name,
          escudoCasa: jogo.teams.home.logo,
          timeFora: jogo.teams.away.name,
          escudoFora: jogo.teams.away.logo,
          horario: jogo.fixture.date.slice(11, 16),
          palpites: ["Palpite indisponível"]
        };
      }
    }));

    res.json(jogosFormatados);
  } catch (erro) {
    console.error("Erro ao buscar jogos:", erro.message);
    res.status(500).send("Erro ao buscar os jogos.");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
      
