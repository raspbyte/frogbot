const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');
const http = require('http');

const CHANNEL_ID = process.env.CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const INTERVAL_MS = 24 * 60 * 60 * 1000;

async function getFrogImage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.unsplash.com',
      path: '/photos/random?query=frog&orientation=landscape',
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const url = json.urls.regular;
          console.log('Frog URL:', url);
          resolve(url);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function sendDailyFrog() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const imageUrl = await getFrogImage();
    await channel.send({
      content: '🐸 Your daily frog!',
      embeds: [{
        title: 'Daily Frog',
        image: { url: imageUrl }
      }]
    });
  } catch (err) {
    console.error('Failed to send frog:', err);
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
  sendDailyFrog();
  setInterval(sendDailyFrog, INTERVAL_MS);
});

// Dummy server to keep Railway awake
http.createServer((req, res) => res.end('🐸')).listen(process.env.PORT || 3000);

client.login(DISCORD_TOKEN);
