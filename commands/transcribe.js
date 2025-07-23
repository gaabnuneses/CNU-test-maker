const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function transcribeAudio(filePath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: 'audio/ogg'
    });
    formData.append('model', 'whisper-1'); // já é o mais barato para transcrição
    const headers = formData.getHeaders();
    const { getOpenAiApiKey } = require('../utils/openaiKey');
    headers['Authorization'] = `Bearer ${getOpenAiApiKey()}`;
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      { headers }
    );
    return response.data.text;
  } catch (error) {
    console.error('[ERROR] Erro na transcrição:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = async function handleTranscribeCommand({ chatId, sock, msg }) {
  try {
    // Verifica se há uma mensagem citada
    if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      await sock.sendMessage(chatId, { text: '❌ Você precisa responder a um áudio para transcrever!' }, { quoted: msg });
      return;
    }
    // Extrai a mensagem citada
    const quoted = msg.message.extendedTextMessage.contextInfo;
    const quotedMsg = quoted.quotedMessage;
    const audioMsg = quotedMsg.audioMessage || quotedMsg.pttMessage;
    if (!audioMsg) {
      await sock.sendMessage(chatId, { text: '❌ Você precisa responder a um áudio para transcrever!' }, { quoted: msg });
      return;
    }
    // Baixa o áudio
    const stream = await sock.downloadMediaMessage({
      key: quoted.stanzaId ? { ...msg.key, id: quoted.stanzaId } : msg.key,
      message: quotedMsg
    });
    if (!stream) {
      await sock.sendMessage(chatId, { text: '❌ Não foi possível baixar os dados do áudio.' }, { quoted: msg });
      return;
    }
    // Salva o áudio em arquivo temporário
    const tempFilePath = path.join(__dirname, '..', 'temp_audio.ogg');
    const writeStream = fs.createWriteStream(tempFilePath);
    await new Promise((resolve, reject) => {
      stream.pipe(writeStream);
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    await sock.sendMessage(chatId, { text: '🔄 Transcrevendo áudio, aguarde...' }, { quoted: msg });
    try {
      const transcription = await transcribeAudio(tempFilePath);
      await sock.sendMessage(chatId, { text: `📝 *Transcrição do áudio:*\n\n${transcription}` }, { quoted: msg });
    } catch (transcriptionError) {
      await sock.sendMessage(chatId, { text: '❌ Ocorreu um erro ao transcrever o áudio. Verifique se a API key da OpenAI está configurada corretamente.' }, { quoted: msg });
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error) {
    console.error('[ERROR] Erro ao processar comando de transcrição:', error);
    await sock.sendMessage(chatId, { text: '❌ Ocorreu um erro ao processar o áudio.' }, { quoted: msg });
  }
};
