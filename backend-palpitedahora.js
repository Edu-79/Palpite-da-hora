const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_KEY = '92e0f4a7bea9a8f54c55e1353c9d53be';
const API_URL = 'https://v3.football.api-sports.io';

app.get('/jogos', async (req, res) => {
  const hoje = new Date().toISOString().slice(0, 10);

  try {
    const response = await axios.get(`${API_URL}/fixtures`, {
      params: { date: hoje },
      headers: { 'x-apisports-key': API_KEY }
    });

    const jogos = response.data.response;

    console.log(`Total de jogos encontrados em ${hoje}: ${jogos.length}`);

    const resultados = [];

    for (const jogo of jogos) {
      const { fixture, teams, league } = jogo;

      const homeId = teams.home.id;
      const awayId = teams.away.id;
      const leagueId = league.id;

      try {
        const [homeStats, awayStats] = await Promise.all([
          axios.get(`${API_URL}/teams/statistics`, {
            params: { team: homeId, league: leagueId },
            headers: { 'x-apisports-key': API_KEY }
          }),
          axios.get(`${API_URL}/teams/statistics`, {
            params: { team: awayId, league: leagueId },
            headers: { 'x-apisports-key': API_KEY }
          })
        ]);

        const homeForm = homeStats.data.response.form || '';
        const awayForm = awayStats.data.response.form || '';

        const homeWins = (homeForm.match(/W/g) || []).length;
        const awayLosses = (awayForm.match(/L/g) || []).length;

        const palpites = [];

        if (homeWins >= 3) palpites.push(`Vitória do ${teams.home.name}`);
        if (awayLosses >= 3) palpites.push(`Derrota do ${teams.away.name}`);
        if (homeWins === awayLosses && homeWins > 0) palpites.push('Empate provável');
        if (palpites.length === 0) palpites.push('Palpite equilibrado');

        resultados.push({
          liga: league.name,
          ligaLogo: league.logo,
          timeCasa: teams.home.name,
          escudoCasa: teams.home.logo,
          timeFora: teams.away.name,
          escudoFora: teams.away.logo,
          horario: fixture.date,
          palpites
        });

      } catch (erroPalpite) {
        console.log(`Erro ao gerar palpite para ${teams.home.name} x ${teams.away.name}: ${erroPalpite.message}`);
        resultados.push({
          liga: league.name,
          ligaLogo: league.logo,
          timeCasa: teams.home.name,
          escudoCasa: teams.home.logo,
          timeFora: teams.away.name,
          escudoFora: teams.away.logo,
          horario: fixture.date,
          palpites: ['Palpite indisponível']
        });
      }
    }

    res.json(resultados);
  } catch (erro) {
    console.error('Erro ao buscar jogos:', erro.message);
    res.status(500).json({ erro: 'Erro ao buscar jogos do dia.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
