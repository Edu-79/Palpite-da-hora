import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/jogos', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const response = await axios.get(`https://v3.football.api-sports.io/fixtures`, {
      headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY },
      params: {
        date: today,
        timezone: 'America/Sao_Paulo'
      }
    });

    const jogos = response.data.response;

    const resultados = await Promise.all(jogos.map(async (jogo) => {
      const prompt = `
Gere 3 palpites coerentes para o jogo entre ${jogo.teams.home.name} e ${jogo.teams.away.name}, analisando desempenho recente, média de gols, força ofensiva e defensiva. Exemplo de formato: 
1 - Vitória do ${jogo.teams.home.name}
2 - Mais de 2.5 gols
3 - Ambas marcam: Sim
Palpites sem contradições entre si.`;

      let palpitesGerados = [];

      try {
        const respostaAI = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });

        palpitesGerados = respostaAI.choices[0].message.content.split('\n').filter(p => p.trim() !== '');
      } catch (erroAI) {
        palpitesGerados = ['Palpite indisponível'];
      }

      return {
        liga: jogo.league.name,
        ligaLogo: jogo.league.logo,
        timeCasa: jogo.teams.home.name,
        escudoCasa: jogo.teams.home.logo,
        timeFora: jogo.teams.away.name,
        escudoFora: jogo.teams.away.logo,
        horario: jogo.fixture.date.slice(11, 16),
        palpites: palpitesGerados
      };
    }));

    res.json(resultados);
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao buscar jogos');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
