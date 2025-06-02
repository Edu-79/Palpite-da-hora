// Arquivo: index.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");
const cors = require("cors");

const app = express();
app.use(cors());

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

app.get("/jogos", async (req, res) => {
  try {
    const dataHoje = new Date().toISOString().split("T")[0];

    const resposta = await axios.get(
      `https://v3.football.api-sports.io/fixtures?date=${dataHoje}`,
      {
        headers: {
          "x-apisports-key": process.env.API_FOOTBALL_KEY,
        },
      }
    );

    const partidas = resposta.data.response;

    const jogos = await Promise.all(
      partidas.map(async (partida) => {
        const liga = partida.league.name;
        const ligaLogo = partida.league.logo;
        const timeCasa = partida.teams.home.name;
        const timeFora = partida.teams.away.name;
        const escudoCasa = partida.teams.home.logo;
        const escudoFora = partida.teams.away.logo;

        const horarioUTC = new Date(partida.fixture.date);
        const horarioLocal = horarioUTC.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        let palpites = [];

        try {
          const prompt = `Com base nos dados: \nTime da casa: ${timeCasa} \nTime visitante: ${timeFora} \nCampeonato: ${liga} \nData: ${dataHoje} \nGere até 3 palpites reais para esse jogo, considerando estatísticas típicas, como gols, escanteios, cartões, etc. Seja objetivo.`;

          const respostaIA = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
          });

          const texto = respostaIA.choices[0].message.content;
          palpites = texto.split("\n").filter((p) => p.trim() !== "");
        } catch (erroIA) {
          palpites = ["Palpite indisponível"];
        }

        return {
          liga,
          ligaLogo,
          timeCasa,
          escudoCasa,
          timeFora,
          escudoFora,
          horario: horarioLocal,
          palpites,
        };
      })
    );

    res.json(jogos);
  } catch (erro) {
    console.error("Erro ao buscar jogos:", erro);
    res.status(500).json({ erro: "Erro ao buscar jogos do API-Football." });
  }
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`Servidor rodando na porta ${PORTA}`);
});
