const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getOpenAiApiKey } = require('../utils/openaiKey');

const TMP_DIR = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const SYSTEM_PROMPT = `You are an English teacher specialized in creating engaging, level-appropriate lessons for WhatsApp. Always follow this structure and these rules:

1. [AUDIO]: Generate a short, natural-sounding English text (8-15 lines) for the lesson, using vocabulary and grammar strictly appropriate for the specified level (A1, A2, B1, B2, C1, C2) and theme. Highlight new or important vocabulary by wrapping it in *asterisks* (e.g., *astonishing*). The text must be interesting, contextual, and suitable for the level and theme. Do NOT use words or structures above the requested level.

2. [TEXT]: Provide the same text as in the audio, with the highlighted vocabulary.

3. [VOCABULARY]: List all highlighted words, each with a simple definition in Portuguese. Only include words that are new or challenging for the specified level.

4. [QUESTIONS]: Create 4-6 short exercises (one line each) about the text. Use a mix of:
   - Fill-in-the-blank (with or without using the highlighted vocabulary)
   - Multiple choice (A/B/C) about meaning, grammar, or synonyms
   - Short direct questions about the text (interpretation, inference, grammar)
   - Ask for synonyms or antonyms of a word from the text
   - Do NOT just repeat sentences from the text. At most 1 question can be a direct copy.
   - All questions must have a clear, direct answer (one word or letter).
   - Vary the type of exercise: at least 2 must NOT be about vocabulary, but about grammar, interpretation, or synonyms.
   - The questions section must start with a suitable title in English, such as "Exercises", "Practice", or "Questions", and not always the same. The title must be returned as a separate field: "questions_title".

5. [ANSWERS]: Provide the correct answer for each question. For multiple choice, give only the letter (A/B/C). For fill-in-the-blank or direct questions, give the word or phrase.

Format your response as JSON:
{
  "audio_text": "...", // the English text for TTS
  "text": "...", // the same text, with *asterisks* for new words
  "vocab": [ { "word": "...", "meaning": "..." }, ... ],
  "questions_title": "...", // e.g. "Exercises", "Practice", "Questions"
  "questions": [ "..." ],
  "answers": [ "..." ]
}

Always adapt the vocabulary and complexity to the requested level (A1, A2, B1, B2, C1, C2) and, if provided, the theme. If no theme or level is given, choose both randomly. Do not include any explanations or comments outside the JSON.`;

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
  let userPrompt = 'Gere uma lição de inglês';
  if (nivel) userPrompt += ` para o nível ${nivel}`;
  if (tema) userPrompt += ` sobre o tema "${tema}"`;
  userPrompt += '.';
  try {
    // Gera a lição (texto, vocabulário, questões, gabarito)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4.1-2025-04-14',
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
    const match = response.data.choices[0].message.content.match(/\{[\s\S]*\}/);
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
    // Gera o áudio com o texto da lição
    const ttsResp = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
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
    const audioPath = path.join(TMP_DIR, `lesson_${Date.now()}.opus`);
    fs.writeFileSync(audioPath, Buffer.from(ttsResp.data));
    // Salva a última lição para tradução posterior
    const LAST_LESSON_PATH = path.join(__dirname, '..', 'last_lesson.json');
    fs.writeFileSync(LAST_LESSON_PATH, JSON.stringify(lessonJson, null, 2), 'utf8');
    // Monta a mensagem WhatsApp
    let msgText = `*Lição de Inglês*\n`;
    if (nivel) msgText += `*Nível:* ${nivel}\n`;
    if (tema) msgText += `*Tema:* ${tema}\n`;
    msgText += `\n*Texto:*\n${lessonJson.text}\n\n*Vocabulário:*\n`;
    lessonJson.vocab.forEach(v => {
      msgText += `- *${v.word}*: ${v.meaning}\n`;
    });
    // Título dinâmico para exercícios
    const questionsTitle = lessonJson.questions_title || 'Exercises';
    msgText += `\n*${questionsTitle}:*\n`;
    lessonJson.questions.forEach((q, i) => {
      msgText += `${i + 1}. ${q}\n`;
    });
    msgText += `\n*Gabarito:*\n`;
    lessonJson.answers.forEach((a, i) => {
      msgText += `${i + 1}. ${a}\n`;
    });
    // Envia áudio primeiro
    await sock.sendMessage(chatId, {
      audio: fs.readFileSync(audioPath),
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: msg });
    // Envia texto estruturado
    await sock.sendMessage(chatId, { text: msgText }, { quoted: msg });
    fs.unlinkSync(audioPath);
  } catch (error) {
    console.error('Erro ao gerar lição:', error?.response?.data || error);
    await sock.sendMessage(chatId, { text: '❌ Erro ao gerar a lição.' }, { quoted: msg });
  }
};
