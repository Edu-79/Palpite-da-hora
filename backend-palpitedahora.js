// index.js completo com integração à API-Football, scraping auxiliar e geração de palpites com IA (OpenAI)

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const API_FOOTBALL_KEY = process.env.FOOTBALL_API_KEY;
const headers = {
  'x-apisports-key': API_FOOTBALL_KEY
};

const gerarPalpiteIA = async (timeCasa, timeFora, estatisticas) => {
  const prompt = `Com base nas estatísticas abaixo, gere até 3 palpites coerentes e não contraditórios para o jogo entre ${timeCasa} e ${timeFora}.

${estatisticas}

Os palpites devem abordar possíveis resultados, gols, escanteios ou cartões.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7
    });

    return completion.choices[0].message.content.split('\n').filter(p => p.trim());
  } catch (err) {
    console.error('Erro na IA:', err);
    return ['Palpite indisponível'];
  }
};

const obterEstatisticasFake = async (time1, time2) => {
  // Simulação de scraping (substitua com scraping real quando pronto)
  return `Últimos jogos do ${time1}: 2 vitórias, 1 empate, 2 derrotas. Média de 1.4 gols por jogo.
Últimos jogos do ${time2}: 3 vitórias, 2 empates. Média de 2.1 gols por jogo.`;
};

app.get('/jogos', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const url = `https://v3.football.api-sports.io/fixtures?date=${hoje}`;
    const response = await axios.get(url, { headers });

    const jogos = await Promise.all(
      response.data.response.map(async jogo => {
        const timeCasa = jogo.teams.home.name;
        const timeFora = jogo.teams.away.name;

        const estatisticas = await obterEstatisticasFake(timeCasa, timeFora);
        const palpites = await gerarPalpiteIA(timeCasa, timeFora, estatisticas);

        return {
          liga: jogo.league.name,
          ligaLogo: jogo.league.logo,
          timeCasa,
          escudoCasa: jogo.teams.home.logo,
          timeFora,
          escudoFora: jogo.teams.away.logo,
          horario: jogo.fixture.date.split('T')[1].substring(0, 5),
          palpites
        };
      })
    );

    res.json(jogos);
  } catch (err) {
    console.error('Erro geral:', err);
    res.json({ erro: 'Erro ao buscar jogos do Football API' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
