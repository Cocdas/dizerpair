const express = require('express');
const fs = require('fs');
const { exec } = require("child_process");
const pino = require("pino");
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    Browsers, 
    jidNormalizedUser 
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

let router = express.Router();

// Function to play the audio file when pairing is complete
function playAudio() {
    const audioPath = './kongga.mp3';
    if (fs.existsSync(audioPath)) {
        exec(`ffplay -nodisp -autoexit "${audioPath}"`, (err) => {
            if (err) {
                console.log('Error playing audio:', err);
            }
        });
    }
}

// Function to remove a file or directory
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Route to handle pairing and session management
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
                console.log("Connection state:", connection);

                if (connection === "open") {
                    try {
                        await delay(10000);

                        const auth_path = './session/';
                        const user_jid = jidNormalizedUser(PrabathPairWeb.user.id);

                        function randomMegaId(length = 6, numberLength = 4) {
                            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                            let result = '';
                            for (let i = 0; i < length; i++) {
                                result += characters.charAt(Math.floor(Math.random() * characters.length));
                            }
                            const number = Math.floor(Math.random() * Math.pow(10, numberLength));
                            return `${result}${number}`;
                        }

                        const mega_url = await upload(fs.createReadStream(auth_path + 'creds.json'), `${randomMegaId()}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        const sid = string_session;

                        // Log session ID and user JID for troubleshooting
                        console.log("Session ID (sid):", sid);
                        console.log("Recipient JID:", user_jid);

                        // Send session ID via WhatsApp message
                        try {
                            await PrabathPairWeb.sendMessage(user_jid, { text: sid });
                            console.log("Session ID sent successfully");
                        } catch (e) {
                            console.error("Error sending session ID:", e);
                        }

                        // Play the audio file when pairing is complete
                        playAudio();

                    } catch (e) {
                        console.error("Error during session processing:", e);
                        exec('pm2 restart prabath');
                    }

                    await delay(100);
                    return await removeFile('./session');
                    process.exit(0);

                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    PrabathPair(); // Attempt reconnection
                }
            });
        } catch (err) {
            console.error("Error in PrabathPair:", err);
            exec('pm2 restart prabath-md');
            console.log("Service restarted");

            await removeFile('./session');
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable" });
            }
        }
    }
    return await PrabathPair();
});

// Handle uncaught exceptions and restart service if needed
process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    exec('pm2 restart prabath');
});

module.exports = router;
