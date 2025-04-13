const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
const pino = require("pino");
const os = require('os');
const axios = require('axios'); // Add axios for downloading files
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

// Add function to download files
async function downloadFile(url, outputPath) {
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
}

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

    const message = `*│🕵️‍♂️ �𝘙𝘶𝘯 𝘛𝘪𝘮𝘦 -* ${runtimeInfo}\n` +
        `*│🕵️‍♂️ 𝘙𝘢𝘮 𝘜𝘴𝘦 -* ${usedRam}MB / ${totalRam}MB\n` +
        `*╰──────────●●►*\n` +
        `*👸 𝘿𝘐𝘡𝘌𝘙 𝘔𝘋*`;

    const imageUrl = 'https://files.catbox.moe/n63u9k.jpg';
    const audioUrl = 'https://github.com/Cocdas/dizerpair/raw/refs/heads/main/alive.ogg';
    const audioPath = path.join(__dirname, 'alive.ogg');

    try {
        // Download the audio file first
        try {
            await downloadFile(audioUrl, audioPath);
            logger.info("Audio file downloaded successfully");
        } catch (downloadError) {
            logger.error("Failed to download audio file: %s", downloadError.message);
            throw new Error("Failed to download audio file");
        }

        // Send image first
        await client.sendMessage(userJid, {
            image: { url: imageUrl },
            caption: message
        });

        // Then send audio
        if (fs.existsSync(audioPath)) {
            await client.sendMessage(userJid, {
                audio: { url: audioPath },
                mimetype: 'audio/ogg',
                ptt: true
            }, {
                upload: true
            });
            logger.info("Audio file sent successfully");
            
            // Clean up the downloaded file after sending
            removeFile(audioPath);
        } else {
            logger.error("Audio file not found: %s", audioPath);
            await client.sendMessage(userJid, { 
                text: "⚠️ Audio file could not be downloaded" 
            });
        }
    } catch (error) {
        logger.error("Failed to send media: %s", error.message);
        // Clean up if file exists
        if (fs.existsSync(audioPath)) {
            removeFile(audioPath);
        }
        // Attempt to send error message if media fails
        try {
            await client.sendMessage(userJid, { 
                text: `❌ Error sending media: ${error.message}` 
            });
        } catch (err) {
            logger.error("Also failed to send error message: %s", err.message);
        }
    }
}

// ... rest of your existing code remains the same ...
