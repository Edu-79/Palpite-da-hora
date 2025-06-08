// index.js (Backend com validação da resposta da OpenAI e API-Football)

const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv\config");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().split("T")[0];

    // Buscar jogos do dia
    const jogosResponse = await axios.get(
      `https://v3.football.api-sports.io/fixtures?date=${hoje}`,
      {
        headers: {
          "x-apisports-key": API_FOOTBALL_KEY,
        },
      }
    );

    const jogos = jogosResponse.data.response;

    const resultados = await Promise.all(
      jogos.map(async (jogo) => {
        const home = jogo.teams.home;
        const away = jogo.teams.away;
        const league = jogo.league;
        const horario = new Date(jogo.fixture.date).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        let palpites = ["Palpite indisponível"];

        try {
          const prompt = `Baseado nas estatísticas de jogos entre ${home.name} e ${away.name}, gere até 3 palpites objetivos para apostas esportivas, como vencedor, ambos marcam, total de gols, escanteios ou cartões. Responda apenas com uma lista.`;

          const openaiRes = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
            },
            {
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
              },
            }
          );

          const texto = openaiRes.data.choices[0]?.message?.content;

          // Extrair linhas do texto (se vier em lista com marcadores ou numeros)
          if (texto) {
            palpites = texto
              .split("\n")
              .filter((line) => line.trim())
              .map((line) => line.replace(/^[-\d\*\.]\s*/, "").trim())
              .filter((line) => line.length > 4);
          }
        } catch (erroOpenAI) {
          console.error("Erro na IA:", erroOpenAI.message);
        }

        return {
          liga: league.name,
          ligaLogo: league.logo,
          timeCasa: home.name,
          escudoCasa: home.logo,
          timeFora: away.name,
          escudoFora: away.logo,
          horario,
          palpites: palpites.length ? palpites : ["Palpite indisponível"],
        };
      })
    );

    res.json(resultados);
  } catch (erro) {
    console.error("Erro geral:", erro.message);
    res.status(500).json({ erro: "Erro ao buscar jogos ou gerar palpites" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
