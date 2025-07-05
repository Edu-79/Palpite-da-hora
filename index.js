import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import cheerio from 'cheerio';
import OpenAI from 'openai';

dotenv.config();
const app = express();
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/jogos', async (req, res) => {
  try {
    const { data } = await axios.get('https://www.sofascore.com/pt/football/livescore');
    const $ = cheerio.load(data);

    const jogos = [];

    $('a').each((i, el) => {
      const texto = $(el).text().trim();
      const partes = texto.split('\n');
      if (partes.length >= 2 && partes[0].includes(' - ')) {
        const [timeA, timeB] = partes[0].split(' - ');
        jogos.push({ timeA, timeB });
      }
    });

    const jogosComPalpite = [];

    for (const jogo of jogos.slice(0, 10)) {
      const prompt = `Com base em dados estatísticos, desempenho recente e estilo de jogo, gere 3 palpites realistas para o confronto entre ${jogo.timeA} e ${jogo.timeB}. Formato curto e direto, sem contradições.`;
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      });
      jogosComPalpite.push({
        ...jogo,
        palpites: response.choices[0].message.content.trim().split('\n'),
      });
    }

    res.json(jogosComPalpite);
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao gerar palpites.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
