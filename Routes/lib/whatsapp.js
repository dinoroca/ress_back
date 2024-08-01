const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const whatsapp = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
      args: ['--no-sandbox','--disable-setuid-sandbox','--disable-web-sexurity', '--disable-setuid-sandbox'],
      headless: true,
    }, 
  webVersionCache: { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014547162-alpha.html', }
});

whatsapp.on('qr', qr => {
  qrcode.generate(qr, {
    small: true
  });
});

whatsapp.on('ready', () => {
  console.log('Client is ready!');
});

module.exports = { whatsapp };