import express from 'express';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.get('/palpites', async (req, res) => {
  try {
    const response = await fetch('https://www.sofascore.com/');
    const body = await response.text();
    const $ = cheerio.load(body);

    // Isso é um exemplo genérico. Adapte a lógica conforme a estrutura real da página.
    let jogos = [];
    $('a[href*="/match/"]').each((i, el) => {
      const titulo = $(el).text().trim();
      if (titulo.length > 10) {
        jogos.push(titulo);
      }
    });

    const prompt = `Com base nessa lista de jogos: ${jogos.slice(0, 10).join(", ")}, gere 3 palpites por jogo de forma objetiva e coerente, incluindo possibilidade de gols, escanteios, cartões ou resultado.`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const palpites = completion.data.choices[0].message.content;
    res.json({ jogos: jogos.slice(0, 10), palpites });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao gerar palpites.');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
