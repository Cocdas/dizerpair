const express = require('express');
const fs = require('fs');
const { exec } = require("child_process");
let router = express.Router();
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

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Function to format runtime
function runtime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

// Function to send image, system info, and audio
async function sendSystemInfoWithMedia(PrabathPairWeb, user_jid) {
    const runtimeInfo = runtime(process.uptime());
    const usedRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = Math.round(os.totalmem() / 1024 / 1024);

    const message = `*│🕵️‍♂️ 𝘙𝘶𝘯 𝘛𝘪𝘮𝘦 -* ${runtimeInfo}\n` +
        `*│🕵️‍♂️ 𝘙𝘢𝘮 𝘜𝘴𝘦 -* ${usedRam}MB / ${totalRam}MB\n` +
        `*╰──────────●●►*\n` +
        `*👸 𝘿𝘐𝘡𝘌𝘙 𝘔𝘋 𝘾𝘰𝘮𝘮𝘢𝘯𝘥 𝘗𝘢𝘯𝘦𝘭*`;

    const imageUrl = 'https://telegra.ph/file/a1519f1a766f7b0ed86e6.png';
    const audioUrl = 'https://github.com/zeusnew/DIZER-MD-V1/raw/main/alive.mp3';

    // Send the image with caption
    await PrabathPairWeb.sendMessage(user_jid, {
        image: { url: imageUrl },
        caption: message
    });

    // Send the audio file
    await PrabathPairWeb.sendMessage(user_jid, {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt: true  // Set to true for a voice message
    });
}

router.get('/', async (req, res) => {
    let num = req.query.number;
    async function PrabathPair() {
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);
        try {
            let PrabathPairWeb = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
            });

            if (!PrabathPairWeb.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await PrabathPairWeb.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            PrabathPairWeb.ev.on('creds.update', saveCreds);
            PrabathPairWeb.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection === "open") {
                    try {
                        await delay(10000);

                        const auth_path = './session/';
                        const user_jid = jidNormalizedUser(PrabathPairWeb.user.id);

                        const mega_url = await upload(fs.createReadStream(auth_path + 'creds.json'), `${user_jid}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');

                        // Send the string session
                        await PrabathPairWeb.sendMessage(user_jid, { text: string_session });

                        // Send the image, system info, and audio
                        await sendSystemInfoWithMedia(PrabathPairWeb, user_jid);

                    } catch (e) {
                        exec('pm2 restart prabath');
                    }

                    await delay(100);
                    return await removeFile('./session');
                    process.exit(0);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    PrabathPair();
                }
            });
        } catch (err) {
            exec('pm2 restart prabath-md');
            console.log("service restarted");
            PrabathPair();
            await removeFile('./session');
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }
    return await PrabathPair();
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    exec('pm2 restart prabath');
});

module.exports = router;
