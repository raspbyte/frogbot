const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function getFrogImage() {
  return new Promise((resolve, reject) => {
    https.get('https://some-random-api.com/animal/frog', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(json.image); // returns a direct image URL
      });
    }).on('error', reject);
  });
}

async function sendDailyFrog() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const imageUrl = await getFrogImage();
  await channel.send({
    content: '🐸',
    embeds: [{ image: { url: imageUrl } }]
  });
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  sendDailyFrog(); // send one immediately on startup
  setInterval(sendDailyFrog, INTERVAL_MS); // then every 24 hours
});

client.login(DISCORD_TOKEN);
