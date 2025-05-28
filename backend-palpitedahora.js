// backend/index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API_KEY = "92e0f4a7bea9a8f54c55e1353c9d53be";
const API_URL = "https://v3.football.api-sports.io";

app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const response = await axios.get(`${API_URL}/fixtures?date=${hoje}`, {
      headers: {
        "x-apisports-key": API_KEY
      }
    });

    res.json(response.data.response);
  } catch (error) {
    console.error("Erro ao buscar jogos:", error.message);
    res.status(500).json({ erro: "Erro ao buscar dados da API-Football." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
