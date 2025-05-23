// BACKEND COM SOFASCORE - NÃO OFICIAL
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*" }));

function timestampParaHoraBr(timestamp) {
  const data = new Date(timestamp * 1000);
  return data.toLocaleTimeString("pt-BR", {
    hour: '2-digit',
    minute: '2-digit'
  });
}

app.get("/jogos", async (req, res) => {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${hoje}`;

    const resposta = await axios.get(url);
    const eventos = resposta.data.events || [];

    const jogos = eventos.slice(0, 10).map(evento => ({
      liga: evento.tournament.name,
      ligaLogo: `https://api.sofascore.app/api/v1/unique-tournament/${evento.tournament.uniqueTournament.id}/image`,
      timeCasa: evento.homeTeam.name,
      escudoCasa: `https://api.sofascore.app/api/v1/team/${evento.homeTeam.id}/image`,
      timeFora: evento.awayTeam.name,
      escudoFora: `https://api.sofascore.app/api/v1/team/${evento.awayTeam.id}/image`,
      horario: timestampParaHoraBr(evento.startTimestamp),
      palpites: ["Jogo carregado via SofaScore"]
    }));

    res.json(jogos);
  } catch (erro) {
    console.error("Erro ao buscar dados do SofaScore:", erro.message);
    res.status(500).json({ erro: "Erro ao buscar jogos do SofaScore" });
  }
});

app.listen(PORT, () => console.log("Servidor com SofaScore ativo na porta " + PORT));
