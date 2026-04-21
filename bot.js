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
      headers: { 'User-Agent': 'frogbot/1.0' }
    };

    https.get(options, (res) => {
      // Follow Reddit's redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectOptions = {
          hostname: 'www.reddit.com',
          path: res.headers.location,
          headers: { 'User-Agent': 'frogbot/1.0' }
        };
        https.get(redirectOptions, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => {
            const json = JSON.parse(data);
            const post = json[0].data.children[0].data;
            const url = post.url;
            if (!url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              return resolve(getFrogImage()); // retry if not an image
            }
            console.log('Frog URL:', url);
            resolve(url);
          });
        }).on('error', reject);
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        const post = json[0].data.children[0].data;
        const url = post.url;
        if (!url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return resolve(getFrogImage()); // retry if not an image
        }
        console.log('Frog URL:', url);
        resolve(url);
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
