const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getOpenAiApiKey } = require('../utils/openaiKey');

const TMP_DIR = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, 'lessonPrompt.txt'), 'utf8');

function parseArgs(text) {
  // Ex: !lesson nivel:B1 tema:travel
  const nivelMatch = text.match(/nivel\s*:?\s*([abcABC][1-2])/i);
  const temaMatch = text.match(/tema\s*:?\s*([\w\s]+)/i);
  const nivel = nivelMatch ? nivelMatch[1].toUpperCase() : null;
  const tema = temaMatch ? temaMatch[1].trim() : null;
  return { nivel, tema };
}

module.exports = async function handleLessonCommand({ text, chatId, sock, msg }) {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    await sock.sendMessage(chatId, { text: '❌ API Key do OpenAI não configurada.' }, { quoted: msg });
    return;
  }
  const { nivel, tema } = parseArgs(text);
  let userPrompt = '';
  if (!nivel && !tema) {
    userPrompt = 'Gere uma lição de inglês para um nível e tema aleatórios, seguindo rigorosamente o formato JSON especificado.';
  } else {
    userPrompt = 'Gere uma lição de inglês';
    if (nivel) userPrompt += ` para o nível ${nivel}`;
    if (tema) userPrompt += ` sobre o tema "${tema}"`;
    userPrompt += ', seguindo rigorosamente o formato JSON especificado.';
  }
  try {
    // Gera a lição (texto, vocabulário, questões, gabarito)
    const completionResp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2500,
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const match = completionResp.data.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (!match) {
      await sock.sendMessage(chatId, { text: '❌ Não foi possível gerar a lição. Tente novamente.' }, { quoted: msg });
      return;
    }
    let lessonJson;
    try {
      lessonJson = JSON.parse(match[0]);
    } catch (e) {
      await sock.sendMessage(chatId, { text: '❌ Erro ao processar a lição gerada.' }, { quoted: msg });
      return;
    }
    // Gera o áudio com o texto da lição (TTS)
    let audioPath = null;
    let ttsResp = null;
    try {
      ttsResp = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1-hd',
          input: lessonJson.audio_text,
          voice: 'nova',
          response_format: 'opus',
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
      audioPath = path.join(TMP_DIR, `lesson_${Date.now()}.opus`);
      fs.writeFileSync(audioPath, Buffer.from(ttsResp.data));
    } catch (e) {
      audioPath = null;
    }
    // Salva a última lição para tradução posterior
    const LAST_LESSON_PATH = path.join(__dirname, '..', 'last_lesson.json');
    fs.writeFileSync(LAST_LESSON_PATH, JSON.stringify(lessonJson, null, 2), 'utf8');
    // Monta a mensagem WhatsApp
    let msgText = `*Lição de Inglês*\n`;
    if (nivel) msgText += `*Nível:* ${nivel}\n`;
    if (tema) msgText += `*Tema:* ${tema}\n`;
    msgText += `\n*Texto:*\n${lessonJson.text}\n\n*Vocabulário:*\n`;
    (lessonJson.vocab || []).forEach(v => {
      msgText += `- *${v.word}*: ${v.meaning}\n`;
    });
    // Título dinâmico para exercícios
    const questionsTitle = lessonJson.questions_title || 'Exercises';
    msgText += `\n*${questionsTitle}:*\n`;
    (lessonJson.questions || []).forEach((q, i) => {
      msgText += `${i + 1}. ${q}\n`;
    });
    msgText += `\n*Gabarito:*\n`;
    (lessonJson.answers || []).forEach((a, i) => {
      msgText += `${i + 1}. ${a}\n`;
    });
    // Envia áudio primeiro se disponível
    if (audioPath) {
      await sock.sendMessage(chatId, {
        audio: fs.readFileSync(audioPath),
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      }, { quoted: msg });
      fs.unlinkSync(audioPath);
    }
    // Envia texto estruturado
    await sock.sendMessage(chatId, { text: msgText }, { quoted: msg });
  } catch (error) {
    console.error('Erro ao gerar lição:', error?.response?.data || error);
    await sock.sendMessage(chatId, { text: '❌ Erro ao gerar a lição.' }, { quoted: msg });
  }
};
