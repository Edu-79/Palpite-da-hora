const express = require("express");
const cors = require("cors");
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.get("/jogos", async (req, res) => {
  const jogos = [
    { campeonato: "Série B", data: "05/07/2025", time_casa: "Remo", time_fora: "Cuiabá" },
    { campeonato: "Série B", data: "05/07/2025", time_casa: "CRB", time_fora: "Santos" },
    { campeonato: "Série B", data: "05/07/2025", time_casa: "Amazonas", time_fora: "Chapecoense" }
  ];

  try {
    const respostas = await Promise.all(jogos.map(async (jogo) => {
      const prompt = `Gere 3 palpites objetivos e curtos baseados em estatísticas para o jogo ${jogo.time_casa} x ${jogo.time_fora}, incluindo possibilidade de vitória, ambas marcam, gols, escanteios ou cartões, sem contradições.`;
      const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const palpites = completion.data.choices[0].message.content
        .split("
")
        .filter(p => p.trim() !== "")
        .map(p => p.replace(/^- /, "").trim());

      return { ...jogo, palpites };
    }));

    res.json(respostas);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erro ao gerar palpites." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => console.log(`Servidor no ar: http://localhost:${PORT}`));
