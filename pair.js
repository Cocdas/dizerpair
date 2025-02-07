const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
const pino = require("pino");
const os = require('os');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

const logger = pino({ level: 'info' });
const router = express.Router();

function removeFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    fs.rmSync(filePath, { recursive: true, force: true });
}

function formatRuntime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

async function sendSystemInfoWithMedia(client, userJid) {
    const runtimeInfo = formatRuntime(process.uptime());
    const usedRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = Math.round(os.totalmem() / 1024 / 1024);

    const message = `*│🕵️‍♂️ 𝘙𝘶𝘯 𝘛𝘪𝘮𝘦 -* ${runtimeInfo}\n` +
        `*│🕵️‍♂️ 𝘙𝘢𝘮 𝘜𝘴𝘦 -* ${usedRam}MB / ${totalRam}MB\n` +
        `*╰──────────●●►*\n` +
        `*👸 𝘿𝘐𝘡𝘌𝘙 𝘔𝘋*`;

    const imageUrl = 'https://files.catbox.moe/n63u9k.jpg';
    const audioPath = path.join(__dirname, 'kongga.mp3');

    try {
        await client.sendMessage(userJid, {
            image: { url: imageUrl },
            caption: message
        });

        if (fs.existsSync(audioPath)) {
            const audioData = fs.readFileSync(audioPath);
            await client.sendMessage(userJid, {
                audio: audioData,
                mimetype: 'audio/mp3',
                ptt: true
            });
        } else {
            logger.error("Audio file not found: %s", audioPath);
        }
    } catch (error) {
        logger.error("Failed to send media: %s", error.message);
    }
}

async function initializeWhatsAppClient(num, res) {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'session'));
    try {
        const client = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger.child({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: logger.child({ level: "fatal" }),
            browser: Browsers.macOS("Safari"),
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
        client.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
                try {
                    await delay(10000);
                    const authPath = path.join(__dirname, 'session');
                    const userJid = jidNormalizedUser(client.user.id);

                    const megaUrl = await upload(fs.createReadStream(path.join(authPath, 'creds.json')), `${userJid}.json`);
                    const stringSession = megaUrl.replace('https://mega.nz/file/', '');

                    await client.sendMessage(userJid, { text: stringSession });
                    await sendSystemInfoWithMedia(client, userJid);

                } catch (error) {
                    logger.error("Error during connection update: %s", error.message);
                    exec('pm2 restart dizer');
                }

                await delay(100);
                removeFile(path.join(__dirname, 'session'));
                process.exit(0);
            } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                await delay(10000);
                initializeWhatsAppClient(num, res);
            }
        });
    } catch (error) {
        logger.error("Error initializing WhatsApp client: %s", error.message);
        exec('pm2 restart prabath-md');
        removeFile(path.join(__dirname, 'session'));
        if (!res.headersSent) {
            res.send({ code: "Service Unavailable" });
        }
    }
}

router.get('/', async (req, res) => {
    const num = req.query.number;
    if (!num) {
        return res.status(400).send({ error: "Number is required" });
    }
    await initializeWhatsAppClient(num, res);
});

process.on('uncaughtException', (err) => {
    logger.error('Caught exception: %s', err.message);
    exec('pm2 restart dizer');
});

module.exports = router;
