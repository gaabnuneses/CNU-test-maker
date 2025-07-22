const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getOpenAiApiKey } = require('../utils/openaiKey');

// Pasta temporária para salvar o áudio
const TMP_DIR = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

module.exports = async function handleSpeechCommand({ chatId, sock, msg }) {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    await sock.sendMessage(chatId, { text: '❌ API Key do OpenAI não configurada.' }, { quoted: msg });
    return;
  }
  // Extrai texto de qualquer tipo de mensagem citada (quote/reply)
  let texto = '';
  // Baileys v5+: msg.quoted
  if (msg.quoted && (msg.quoted.text || msg.quoted.body)) {
    texto = msg.quoted.text || msg.quoted.body;
  }
  // Mensagem citada via extendedTextMessage
  else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
    const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
    texto = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || quotedMsg.imageMessage?.caption || quotedMsg.videoMessage?.caption || '';
  }
  // Baileys v4: msg.message?.contextInfo?.quotedMessage
  else if (msg.message?.contextInfo?.quotedMessage) {
    const quotedMsg = msg.message.contextInfo.quotedMessage;
    texto = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || quotedMsg.imageMessage?.caption || quotedMsg.videoMessage?.caption || '';
  }
  // Fallback: tenta pegar texto de reply simples
  else if (msg.message?.conversation) {
    texto = msg.message.conversation;
  }
  if (!texto || texto.length < 2) {
    await sock.sendMessage(chatId, { text: 'Responda a uma mensagem de texto com !speech para converter em áudio.' }, { quoted: msg });
    return;
  }
  try {
    // Chama a API de TTS da OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        input: texto,
        voice: 'onyx', // ou 'nova', 'echo', 'fable', 'alloy', etc.
        response_format: 'opus', // formato compatível com WhatsApp
        speed: 1.0
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    // Salva o áudio temporariamente
    const audioPath = path.join(TMP_DIR, `speech_${Date.now()}.opus`);
    fs.writeFileSync(audioPath, Buffer.from(response.data));
    // Envia como áudio/ptt (push-to-talk)
    await sock.sendMessage(chatId, {
      audio: fs.readFileSync(audioPath),
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: msg });
    // Limpa arquivo temporário
    fs.unlinkSync(audioPath);
  } catch (error) {
    console.error('Erro ao gerar áudio:', error?.response?.data || error);
    await sock.sendMessage(chatId, { text: '❌ Erro ao gerar áudio. Verifique sua chave e tente novamente.' }, { quoted: msg });
  }
};
