const qrcode = require('qrcode-terminal');
const { Client, LocalAuth  } = require('whatsapp-web.js');

const whatsapp = new Client({
  puppeteer: {
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	},
  authStrategy: new LocalAuth(),
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
}
});

whatsapp.on('qr', qr => {
  qrcode.generate(qr, {
      small: true
  });
});

whatsapp.on('ready', () => {
  console.log('Client is ready!');
});

module.exports = {whatsapp};