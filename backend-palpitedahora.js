import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/jogos', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const url = `https://v3.football.api-sports.io/fixtures?date=${hoje}`;

    const resposta = await fetch(url, {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY
      }
    });

    const dados = await resposta.json();

    const jogos = await Promise.all(
      dados.response.map(async (jogo) => {
        const timeCasa = jogo.teams.home.name;
        const timeFora = jogo.teams.away.name;
        const escudoCasa = jogo.teams.home.logo;
        const escudoFora = jogo.teams.away.logo;
        const horario = new Date(jogo.fixture.date).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
        const liga = jogo.league.name;
        const ligaLogo = jogo.league.logo;

        let palpites = [];

        try {
          const prompt = `Com base em estatísticas, quais são 3 palpites realistas para o jogo entre ${timeCasa} e ${timeFora}? Inclua possibilidades como: vitória, total de gols, escanteios, ou cartões. Seja objetivo e sem repetições.`;

          const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 100,
            }),
          });

          const openaiJson = await openaiResp.json();
          palpites = openaiJson.choices?.[0]?.message?.content?.split('\n').filter(p => p.trim()) || ["Palpite indisponível"];
        } catch (err) {
          palpites = ["Palpite indisponível"];
        }

        return {
          liga,
          ligaLogo,
          timeCasa,
          escudoCasa,
          timeFora,
          escudoFora,
          horario,
          palpites
        };
      })
    );

    res.json(jogos);
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao buscar dados dos jogos' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
