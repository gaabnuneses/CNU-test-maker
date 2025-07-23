const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getOpenAiApiKey } = require('../utils/openaiKey');

// Arquivo temporário para guardar a última lição gerada
const LAST_LESSON_PATH = path.join(__dirname, '..', 'last_lesson.json');

module.exports = async function handleTraduzCommand({ chatId, sock, msg }) {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    await sock.sendMessage(chatId, { text: '❌ API Key do OpenAI não configurada.' }, { quoted: msg });
    return;
  }
  // Verifica se existe uma lição salva
  if (!fs.existsSync(LAST_LESSON_PATH)) {
    await sock.sendMessage(chatId, { text: 'Nenhuma lição encontrada para traduzir. Gere uma lição com !lesson primeiro.' }, { quoted: msg });
    return;
  }
  const lesson = JSON.parse(fs.readFileSync(LAST_LESSON_PATH, 'utf8'));
  // Monta o texto a ser traduzido
  let toTranslate = `Texto:\n${lesson.text}\n\n${lesson.questions_title}:\n`;
  lesson.questions.forEach((q, i) => {
    toTranslate += `${i + 1}. ${q}\n`;
  });
  toTranslate += `\nGabarito:\n`;
  lesson.answers.forEach((a, i) => {
    toTranslate += `${i + 1}. ${a}\n`;
  });
  try {
    // Usa OpenAI para traduzir para português
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // já é o mais barato para texto
        messages: [
          { role: 'system', content: 'Traduza todo o conteúdo a seguir para português, mantendo a formatação e os títulos:' },
          { role: 'user', content: toTranslate }
        ],
        max_tokens: 1200,
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const translated = response.data.choices[0].message.content.trim();
    await sock.sendMessage(chatId, { text: translated }, { quoted: msg });
  } catch (error) {
    console.error('Erro ao traduzir:', error?.response?.data || error);
    await sock.sendMessage(chatId, { text: '❌ Erro ao traduzir.' }, { quoted: msg });
  }
};
