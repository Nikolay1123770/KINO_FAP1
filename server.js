import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Прокси для M3U
app.get("/proxy", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send("Укажите параметр url");
    }

    const response = await fetch(url);
    const text = await response.text();

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(text);
  } catch (err) {
    console.error("Ошибка прокси:", err);
    res.status(500).send("Ошибка прокси");
  }
});

// Тестовый маршрут
app.get("/", (req, res) => {
  res.send("Proxy-сервер работает ✅");
});

app.listen(PORT, () => {
  console.log(`Proxy-сервер запущен на порту ${PORT}`);
});
