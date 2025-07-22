const lessonIdiomaUniversalHandler = require('./commands/lessonidioma');
const handleComandosCommand = require('./commands/comandos');
const handleGabaritoCommand = require('./commands/gabarito');
// Simple WhatsApp bot using Baileys
// To run: npm install @whiskeysockets/baileys

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');


const handleLastfmCommand = require('./commands/lastfm');
const handleYoutubeCommand = require('./commands/youtube');
const handleTodosCommand = require('./commands/todos');
const handleGptCommand = require('./commands/gpt');
const handleTranscribeCommand = require('./commands/transcribe');
const handleQuestoesCommand = require('./commands/questoes');
const handleSpeechCommand = require('./commands/speech');
const handleLessonCommand = require('./commands/lesson');
const handleTraduzCommand = require('./commands/traduz');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.message) continue;
            const chatId = msg.key.remoteJid;
            const senderId = msg.key.participant || msg.key.remoteJid;
            const fromMe = msg.key.fromMe;
            const timestamp = msg.messageTimestamp ? new Date(Number(msg.messageTimestamp) * 1000).toLocaleString() : '-';
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
            console.log('==============================');
            console.log(`📥 Mensagem recebida:`);
            console.log(`  🕒 Data/Hora: ${timestamp}`);
            console.log(`  💬 Texto: ${text || '[vazio]'}`);
            console.log(`  👤 SenderId: ${senderId}`);
            console.log(`  💬 ChatId: ${chatId}`);
            console.log(`  🙋‍♂️ Enviada por você? ${fromMe ? 'Sim' : 'Não'}`);
            console.log('==============================\n');

            // Reação temática por comando
            const react = async emoji => {
                await sock.sendMessage(chatId, {
                    react: {
                        text: emoji,
                        key: msg.key
                    }
                });
            };

            if (text.trim() === '!ping') {
                await react('👋');
                await sock.sendMessage(chatId, { text: '!pong' }, { quoted: msg });
            } else if (text.trim().toLowerCase().startsWith('!lastfm ')) {
                await react('🎶');
                await handleLastfmCommand({ text, chatId, sock, msg });
            } else if (text.trim().toLowerCase().startsWith('!yt ')) {
                await react('🔍');
                await handleYoutubeCommand({ text, chatId, sock, msg });
            } else if (text.trim().toLowerCase().startsWith('!todos')) {
                await react('📢');
                await handleTodosCommand({ text, chatId, sock, msg });
            } else if (text.trim().toLowerCase().startsWith('!gpt ')) {
                await react('🤖');
                await handleGptCommand({ text, chatId, sock, msg });
            } else if (text.trim().toLowerCase().startsWith('!trans')) {
                await react('🎤');
                await handleTranscribeCommand({ chatId, sock, msg });
            } else if (/^!ques(t[oóõôöòṍÕÓÔÖÒ])?es\b/i.test(text.trim())) {
                await react('📚');
                await handleQuestoesCommand({ text, chatId, sock, msg });
            } else if (text.trim().toLowerCase().startsWith('!speech')) {
                await react('🔊');
                await handleSpeechCommand({ chatId, sock, msg });
            } else if (text.trim().toLowerCase().startsWith('!lesson')) {
                await react('📝');
                await handleLessonCommand({ text, chatId, sock, msg });
            } else if (text.trim().toLowerCase().startsWith('!lessonidioma')) {
                await react('🌐');
                await lessonIdiomaUniversalHandler({ text, chatId, sock, msg });
            } else if (text.trim().toLowerCase().startsWith('!traduz')) {
                await react('🌎');
                await handleTraduzCommand({ chatId, sock, msg });
            } else if (text.trim().toLowerCase().startsWith('!gabarito')) {
                await react('✅');
                await handleGabaritoCommand({ text, chatId, sock, msg });
            } else if (text.trim().toLowerCase().startsWith('!comandos')) {
                await react('📖');
                await handleComandosCommand({ chatId, sock, msg });
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log('Escaneie o QR code acima para conectar seu WhatsApp.');
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = new Boom(lastDisconnect?.error))?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to', lastDisconnect.error, ', reconnecting', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Bot is online!');
        }
    });
}

startBot();
