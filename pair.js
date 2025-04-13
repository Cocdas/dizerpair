const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const pino = require('pino');
const os = require('os');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require('@whiskeysockets/baileys');
const { upload } = require('./mega'); // ඔබගේ MEGA upload function එක

const logger = pino({ level: 'info' });
const app = express();
const router = express.Router();

// Audio file download කිරීමට function එක
async function downloadAudio(url, outputPath) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Download failed: ${error.message}`);
    }
}

// File delete කිරීමට function එක
function removeFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    fs.rmSync(filePath, { recursive: true, force: true });
}

// System runtime format කිරීම
function formatRuntime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

// WhatsApp එකට image + audio යැවීම
async function sendSystemInfoWithMedia(client, userJid) {
    const runtimeInfo = formatRuntime(process.uptime());
    const usedRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = Math.round(os.totalmem() / 1024 / 1024);

    const message = `*│🕵️‍♂️ 𝘙𝘶𝘯 𝘛𝘪𝘮𝘦 -* ${runtimeInfo}\n` +
                   `*│🕵️‍♂️ 𝘙𝘢𝘮 𝘜𝘴𝘦 -* ${usedRam}MB / ${totalRam}MB\n` +
                   `*╰──────────●●►*\n` +
                   `*👸 𝘿𝘐𝘡𝘌𝘙 𝘔𝘋*`;

    const imageUrl = 'https://files.catbox.moe/n63u9k.jpg';
    const audioUrl = 'https://github.com/Cocdas/dizerpair/raw/refs/heads/main/alive.ogg';
    const audioPath = path.join(__dirname, 'alive.ogg');

    try {
        // 1. Image එක යවන්න
        await client.sendMessage(userJid, {
            image: { url: imageUrl },
            caption: message,
        });

        // 2. Audio download කරගෙන යවන්න
        await downloadAudio(audioUrl, audioPath);
        await client.sendMessage(userJid, {
            audio: fs.readFileSync(audioPath),
            mimetype: 'audio/ogg',
            ptt: true,
        });

        // 3. Audio file එක delete කරන්න
        removeFile(audioPath);
    } catch (error) {
        logger.error('Media send error:', error);
        await client.sendMessage(userJid, {
            text: '❌ Media යැවීමට අසමත් විය!',
        });
    }
}

// WhatsApp client initialize කිරීම
async function initializeWhatsAppClient(num, res) {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'session'));
    
    try {
        const client = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger.child({ level: 'fatal' })),
            },
            printQRInTerminal: false,
            logger: logger.child({ level: 'fatal' }),
            browser: Browsers.macOS('Safari'),
        });

        if (!client.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await client.requestPairingCode(num);
            if (!res.headersSent) {
                res.send({ code });
            }
        }

        client.ev.on('creds.update', saveCreds);
        client.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'open') {
                try {
                    await delay(10000);
                    const authPath = path.join(__dirname, 'session');
                    const userJid = jidNormalizedUser(client.user.id);

                    // Creds.json MEGA එකට upload කිරීම
                    const megaUrl = await upload(
                        fs.createReadStream(path.join(authPath, 'creds.json')),
                        `${userJid}.json`
                    );
                    const stringSession = megaUrl.replace('https://mega.nz/file/', '');

                    await client.sendMessage(userJid, { text: stringSession });
                    await sendSystemInfoWithMedia(client, userJid);

                } catch (error) {
                    logger.error('Connection error:', error);
                    exec('pm2 restart dizer');
                }

                await delay(100);
                removeFile(path.join(__dirname, 'session'));
                process.exit(0);
            } else if (
                connection === 'close' &&
                lastDisconnect &&
                lastDisconnect.error &&
                lastDisconnect.error.output.statusCode !== 401
            ) {
                await delay(10000);
                initializeWhatsAppClient(num, res);
            }
        });
    } catch (error) {
        logger.error('WhatsApp init error:', error);
        exec('pm2 restart dizer');
        removeFile(path.join(__dirname, 'session'));
        if (!res.headersSent) {
            res.status(500).send({ error: 'Service Unavailable' });
        }
    }
}

// Router setup
router.get('/', async (req, res) => {
    const num = req.query.number;
    if (!num) {
        return res.status(400).send({ error: 'Number is required!' });
    }
    await initializeWhatsAppClient(num, res);
});

app.use(express.json());
app.use('/', router);

// Error handling
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    exec('pm2 restart dizer');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

module.exports = router;
