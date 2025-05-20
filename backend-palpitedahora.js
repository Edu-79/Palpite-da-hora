
// BACKEND PARA PALPITE DA HORA (API-FOOTBALL)
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_KEY = 'acbb8110aa46345c241f0562f3a0e24d';
const API_URL = 'https://v3.football.api-sports.io/fixtures';

app.get('/jogos', async (req, res) => {
  const hoje = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD

  try {
    const response = await axios.get(API_URL, {
      params: { date: hoje },
      headers: {
        'x-apisports-key': API_KEY
      }
    });

    const jogos = response.data.response.map(jogo => ({
      homeTeam: jogo.teams.home.name,
      awayTeam: jogo.teams.away.name,
      utcDate: jogo.fixture.date,
      league: jogo.league.name,
      country: jogo.league.country
    }));

    res.json(jogos);
  } catch (error) {
    console.error('Erro ao buscar jogos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar jogos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
