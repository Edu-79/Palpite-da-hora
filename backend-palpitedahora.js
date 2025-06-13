// index.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.get('/jogos', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const resposta = await fetch(`https://v3.football.api-sports.io/fixtures?date=${hoje}`, {
      headers: { 'x-apisports-key': process.env.FOOTBALL_API_KEY }
    });
    const json = await resposta.json();

    const partidas = json.response;

    const jogosProcessados = await Promise.all(partidas.map(async partida => {
      const prompt = `Com base nas estatísticas de um jogo entre ${partida.teams.home.name} e ${partida.teams.away.name}, gere 3 palpites prováveis de resultado (sem repetir ou contradizer).`;

      let palpites = ["Palpite indisponível"];
      try {
        const ia = await openai.createChatCompletion({
          model: "gpt-4",
          messages: [
            { role: "system", content: "Você é um especialista em análise estatística esportiva." },
            { role: "user", content: prompt }
          ]
        });
        const texto = ia.data.choices[0].message.content.trim();
        palpites = texto.split('\n').filter(p => p);
      } catch (err) {
        console.error("Erro com a OpenAI:", err.message);
      }

      return {
        liga: partida.league.name,
        ligaLogo: partida.league.logo,
        timeCasa: partida.teams.home.name,
        escudoCasa: partida.teams.home.logo,
        timeFora: partida.teams.away.name,
        escudoFora: partida.teams.away.logo,
        horario: new Date(partida.fixture.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        palpites
      };
    }));

    res.json(jogosProcessados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar jogos ou gerar palpites." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
