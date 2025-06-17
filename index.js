import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

app.get('/jogos', async (req, res) => {
  try {
    const response = await fetch('https://v3.football.api-sports.io/fixtures?date=' + new Date().toISOString().split('T')[0], {
      headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY }
    });
    const data = await response.json();
    const jogos = [];

    for (const item of data.response) {
      const timeCasa = item.teams.home.name;
      const timeFora = item.teams.away.name;
      const escudoCasa = item.teams.home.logo;
      const escudoFora = item.teams.away.logo;
      const horario = item.fixture.date.substring(11, 16);
      const liga = item.league.name;
      const ligaLogo = item.league.logo;

      const prompt = `Baseado nas estatísticas históricas e desempenho recente, me dê 3 palpites realistas e não contraditórios para o jogo de futebol entre ${timeCasa} x ${timeFora} de hoje (${liga}). Seja objetivo nos palpites, pode sugerir: resultado, total de gols, escanteios ou cartões.`;

      let palpites = [];

      try {
        const aiResponse = await openai.createChatCompletion({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const texto = aiResponse.data.choices[0].message.content;
        palpites = texto.split('\n').filter(p => p.trim() !== '');
      } catch (error) {
        console.log('Erro ao consultar a OpenAI:', error.message);
        palpites = ['Palpite indisponível'];
      }

      jogos.push({ liga, ligaLogo, timeCasa, escudoCasa, timeFora, escudoFora, horario, palpites });
    }

    res.json(jogos);
  } catch (error) {
    console.error('Erro ao buscar jogos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar os jogos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
