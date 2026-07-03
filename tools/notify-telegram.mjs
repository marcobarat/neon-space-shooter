#!/usr/bin/env node
// Invia un messaggio Telegram. Il token NON è nel codice: va nell'ambiente.
//   TELEGRAM_BOT_TOKEN  (obbligatorio)  — token del bot (@BotFather)
//   TELEGRAM_CHAT_ID    (opzionale)     — default: 9722068
// Uso:  TELEGRAM_BOT_TOKEN=xxx node tools/notify-telegram.mjs "Ciao dal gioco"
//   o:  npm run notify -- "Messaggio"
const token = process.env.TELEGRAM_BOT_TOKEN;
const chat = process.env.TELEGRAM_CHAT_ID || "9722068";
const msg = process.argv.slice(2).join(" ") || "Notifica da Neon Space Shooter";

if (!token) {
  console.error("Errore: manca la variabile d'ambiente TELEGRAM_BOT_TOKEN.");
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: chat, text: msg }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`Telegram ha risposto ${res.status}: ${body}`);
  process.exit(1);
}
console.log("Messaggio inviato ✔");
