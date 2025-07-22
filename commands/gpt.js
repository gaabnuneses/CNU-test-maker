
const axios = require('axios');
const { getOpenAiApiKey } = require('../utils/openaiKey');

/**
 * Comando !gpt para responder perguntas usando a API do ChatGPT (OpenAI)
 * Uso: !gpt [pergunta]
 * Requer variável de ambiente OPENAI_API_KEY
 */
module.exports = async function handleGptCommand({ text, chatId, sock, msg }) {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    await sock.sendMessage(chatId, { text: '❌ API Key do OpenAI não configurada. Defina a variável OPENAI_API_KEY.' }, { quoted: msg });
    return;
  }
  const prompt = text.trim().slice(4).trim();
  if (!prompt) {
    await sock.sendMessage(chatId, { text: 'Por favor, envie uma pergunta após o comando. Exemplo: !gpt Qual a capital da França?' }, { quoted: msg });
    return;
  }
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const answer = response.data.choices && response.data.choices[0]?.message?.content
      ? response.data.choices[0].message.content.trim()
      : 'Desculpe, não consegui gerar uma resposta.';
    await sock.sendMessage(chatId, { text: answer }, { quoted: msg });
  } catch (error) {
    console.error('Erro ao consultar a API do ChatGPT:', error?.response?.data || error);
    await sock.sendMessage(chatId, { text: '❌ Ocorreu um erro ao consultar a API do ChatGPT.' }, { quoted: msg });
  }
};
