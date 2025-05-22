const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_KEY = 'acbb8110aa46345c241f056e90d15a0d';
const API_URL = 'https://v3.football.api-sports.io';

async function gerarPalpites(homeId, awayId, leagueId) {
  try {
    const [homeStats, awayStats] = await Promise.all([
      axios.get(`${API_URL}/teams/statistics`, {
        params: { team: homeId, league: leagueId, season: 2023 },
        headers: { 'x-apisports-key': API_KEY }
      }),
      axios.get(`${API_URL}/teams/statistics`, {
        params: { team: awayId, league: leagueId, season: 2023 },
        headers: { 'x-apisports-key': API_KEY }
      })
    ]);

    const home = homeStats.data.response;
    const away = awayStats.data.response;

    const palpites = [];

    const homeWin = home.fixtures.wins.total || 0;
    const awayWin = away.fixtures.wins.total || 0;

    if (homeWin > awayWin) {
      palpites.push(`Vitória do ${home.team.name}`);
    } else if (awayWin > homeWin) {
      palpites.push(`Vitória do ${away.team.name}`);
    } else {
      palpites.push('Empate provável');
    }

    const avgGoalsHome = home.goals.for.total.total / (home.fixtures.played.total || 1);
    const avgGoalsAway = away.goals.for.total.total / (away.fixtures.played.total || 1);
    const mediaTotal = avgGoalsHome + avgGoalsAway;

    if (mediaTotal >= 2.5) {
      palpites.push('Mais de 2.5 gols');
    } else {
      palpites.push('Menos de 2.5 gols');
    }

    if (avgGoalsHome >= 1 && avgGoalsAway >= 1) {
      palpites.push('Ambas equipes marcam');
    }

    if (home.clean_sheet.total > away.clean_sheet.total) {
      palpites.push(`${home.team.name} não sofre gol`);
    } else if (away.clean_sheet.total > home.clean_sheet.total) {
      palpites.push(`${away.team.name} não sofre gol`);
    }

    return palpites.slice(0, 4);
  } catch (err) {
    console.error('Erro ao gerar palpite:', err.message);
    return ['Palpite indisponível'];
  }
}

app.get('/jogos', async (req, res) => {
  const hoje = new Date().toISOString().slice(0, 10); // DATA DINÂMICA DE HOJE

  try {
    const response = await axios.get(`${API_URL}/fixtures`, {
      params: { date: hoje },
      headers: { 'x-apisports-key': API_KEY }
    });

    console.log(`Total de jogos encontrados em ${hoje}:`, response.data.response.length);

    const jogos = await Promise.all(
      response.data.response.map(async (jogo) => {
        const home = jogo.teams.home;
        const away = jogo.teams.away;
        const league = jogo.league;

        const palpites = await gerarPalpites(home.id, away.id, league.id);

        return {
          liga: league.name,
          ligaLogo: league.logo,
          timeCasa: home.name,
          escudoCasa: home.logo,
          timeFora: away.name,
          escudoFora: away.logo,
          horario: new Date(jogo.fixture.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          palpites: palpites
        };
      })
    );

    res.json(jogos);
  } catch (error) {
    console.error('Erro ao buscar jogos:', error.message);
    res.status(500).json({ erro: 'Erro ao buscar jogos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
