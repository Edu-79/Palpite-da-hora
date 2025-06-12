
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const getPalpiteIA = async (jogo) => {
  try {
    const prompt = `Com base nos times: ${jogo.timeCasa} x ${jogo.timeFora}, gere até 3 palpites realistas com base em padrões de estatísticas como escanteios, gols e cartões, sem usar estatísticas reais.`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const palpites = response.data.choices[0].message.content.trim().split("\n").filter(Boolean);
    return palpites;
  } catch (error) {
    return ["Palpite indisponível"];
  }
};

app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const response = await axios.get("https://v3.football.api-sports.io/fixtures", {
      headers: {
        "x-apisports-key": FOOTBALL_API_KEY,
      },
      params: {
        date: hoje,
        timezone: "America/Sao_Paulo",
      },
    });

    const jogos = await Promise.all(
      response.data.response.map(async (jogo) => {
        const timeCasa = jogo.teams.home.name;
        const escudoCasa = jogo.teams.home.logo;
        const timeFora = jogo.teams.away.name;
        const escudoFora = jogo.teams.away.logo;
        const horario = jogo.fixture.date.slice(11, 16);
        const liga = jogo.league.name;
        const ligaLogo = jogo.league.logo;
        const palpites = await getPalpiteIA({ timeCasa, timeFora });

        return { liga, ligaLogo, timeCasa, escudoCasa, timeFora, escudoFora, horario, palpites };
      })
    );

    res.json(jogos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar jogos ou gerar palpites" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
