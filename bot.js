const { Client, GatewayIntentBits } = require('discord.js');
const https = require('https');
const http = require('http');

const CHANNEL_ID = process.env.CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const INTERVAL_MS = 24 * 60 * 60 * 1000;

async function getFrogImage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.reddit.com',
      path: '/r/frogs/random/.json',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Check we actually got JSON before parsing
        if (!data.trim().startsWith('[') && !data.trim().startsWith('{')) {
          console.error('Reddit returned non-JSON response, status:', res.statusCode);
          return reject(new Error('Reddit blocked the request'));
        }
        try {
          const json = JSON.parse(data);
          const post = json[0].data.children[0].data;
          const url = post.url;
          if (!url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return resolve(getFrogImage());
          }
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
