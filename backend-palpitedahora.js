// backend/index.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());

app.get('/jogos', async (req, res) => {
  try {
    // Exemplo de scraping (simulado)
    const dadosExemplo = [
      {
        liga: 'Brasileirão Série A',
        ligaLogo: 'https://media.api-sports.io/football/leagues/71.png',
        timeCasa: 'Flamengo',
        escudoCasa: 'https://media.api-sports.io/football/teams/131.png',
        timeFora: 'Palmeiras',
        escudoFora: 'https://media.api-sports.io/football/teams/126.png',
        horario: '20:30',
        estatisticas: {
          vitoriasCasa: 10,
          vitoriasFora: 6,
          empates: 4,
          mediaGols: 2.7,
          escanteios: 10,
          cartoes: 5
        }
      }
    ];

    const respostasComPalpites = await Promise.all(
      dadosExemplo.map(async (jogo) => {
        try {
          const prompt = `Com base nestes dados: \nVitórias do time da casa: ${jogo.estatisticas.vitoriasCasa}\nVitórias do visitante: ${jogo.estatisticas.vitoriasFora}\nEmpates: ${jogo.estatisticas.empates}\nMédia de gols: ${jogo.estatisticas.mediaGols}\nEscanteios: ${jogo.estatisticas.escanteios}\nCartões: ${jogo.estatisticas.cartoes}\n\nCrie 3 palpites coerentes para este jogo (${jogo.timeCasa} x ${jogo.timeFora}). Evite contradições como empate e vitória. Seja claro.`;

          const resposta = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4',
              messages: [
                { role: 'system', content: 'Você é um especialista em previsões de futebol.' },
                { role: 'user', content: prompt }
              ]
            },
            {
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const texto = resposta.data.choices[0].message.content;
          const palpites = texto.split('\n').filter(p => p.trim() !== '');

          return { ...jogo, palpites };
        } catch (error) {
          console.error('Erro ao gerar palpite para um jogo:', error.message);
          return { ...jogo, palpites: ['Palpite indisponível'] };
        }
      })
    );

    res.json(respostasComPalpites);
  } catch (erro) {
    console.error('Erro geral ao buscar jogos:', erro.message);
    res.status(500).json({ erro: 'Erro ao buscar jogos ou gerar palpites' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
