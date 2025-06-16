
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.get('/palpites', async (req, res) => {
    try {
        const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: \`
Você é um especialista em futebol e estatísticas esportivas. Liste todos os jogos de futebol que acontecem hoje, incluindo os principais campeonatos do mundo e as Séries A, B e C do Campeonato Brasileiro. Separe os jogos por campeonato. Para cada jogo, inclua:
- Nome dos times
- Horário
- Breve análise estatística baseada em dados recentes
- No mínimo 3 palpites (resultado, gols, escanteios, etc), sempre baseados em estatísticas reais e evitando contradições.

Responda no seguinte formato JSON:
[
  {
    "campeonato": "Nome do Campeonato",
    "jogos": [
      {
        "partida": "Time X vs Time Y",
        "horario": "Horário",
        "analise": "Resumo estatístico",
        "palpites": ["Palpite 1", "Palpite 2", "Palpite 3"]
      }
    ]
  }
]
\`
                }
            ],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': \`Bearer \${process.env.OPENAI_API_KEY}\`,
                'Content-Type': 'application/json'
            }
        });

        res.json(openaiResponse.data.choices[0].message.content);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar palpites.');
    }
});

app.listen(PORT, () => {
    console.log(\`Servidor rodando na porta \${PORT}\`);
});
