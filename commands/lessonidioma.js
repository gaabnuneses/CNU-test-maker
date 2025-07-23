
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getOpenAiApiKey } = require('../utils/openaiKey');

const TMP_DIR = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);


function parseArgs(text) {
  // Aceita parâmetros em qualquer ordem, todos com prefixo
  // Ex: !lessonidioma idioma: italiano nivel: B1 tema: viagens
  const idiomaMatch = text.match(/idioma\s*:\s*([\wçãáéíóúâêôàèìòùäëïöüñÇÃÁÉÍÓÚÂÊÔÀÈÌÒÙÄËÏÖÜÑ]+)/i);
  const nivelMatch = text.match(/nivel\s*:\s*([a-zA-Z0-9çãáéíóúâêôàèìòùäëïöüñÇÃÁÉÍÓÚÂÊÔÀÈÌÒÙÄËÏÖÜÑ]+)/i);
  const temaMatch = text.match(/tema\s*:\s*([\w\sçãáéíóúâêôàèìòùäëïöüñÇÃÁÉÍÓÚÂÊÔÀÈÌÒÙÄËÏÖÜÑ]+)/i);
  const idioma = idiomaMatch ? idiomaMatch[1].trim().toLowerCase() : null;
  const nivel = nivelMatch ? nivelMatch[1].trim() : null;
  const tema = temaMatch ? temaMatch[1].trim() : null;
  return { idioma, nivel, tema };
}


async function lessonIdiomaUniversalHandler({ text, chatId, sock, msg }) {
  console.log('--- [lessonidioma] Mensagem recebida:', text);
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    await sock.sendMessage(chatId, { text: '❌ API Key do OpenAI não configurada.' }, { quoted: msg });
    return;
  }

  const { idioma, nivel, tema } = parseArgs(text);
  console.log('--- [lessonidioma] Parâmetros extraídos:', { idioma, nivel, tema });

  // Mapeamento simples de idiomas comuns para inglês (pode ser expandido)
  const idiomaMap = {
    'italiano': 'italian',
    'francês': 'french',
    'frances': 'french',
    'espanhol': 'spanish',
    'alemão': 'german',
    'aleman': 'german',
    'português': 'portuguese',
    'portugues': 'portuguese',
    'inglês': 'english',
    'ingles': 'english',
    'japonês': 'japanese',
    'japones': 'japanese',
    'mandarim': 'chinese',
    'chinês': 'chinese',
    'chines': 'chinese',
    'russo': 'russian',
    'árabe': 'arabic',
    'arabe': 'arabic',
    'coreano': 'korean',
    'grego': 'greek',
    'turco': 'turkish',
    'hindi': 'hindi',
    'hebraico': 'hebrew',
    'polonês': 'polish',
    'polones': 'polish',
    'sueco': 'swedish',
    'norueguês': 'norwegian',
    'noruegues': 'norwegian',
    'tcheco': 'czech',
    'checo': 'czech',
    'romeno': 'romanian',
    'ucraniano': 'ukrainian',
    'húngaro': 'hungarian',
    'hungaro': 'hungarian',
    'finlandês': 'finnish',
    'finlandes': 'finnish',
    'neerlandês': 'dutch',
    'neerlandes': 'dutch',
    'holandês': 'dutch',
    'holandes': 'dutch',
    'croata': 'croatian',
    'búlgaro': 'bulgarian',
    'bulgaro': 'bulgarian',
    'dinamarquês': 'danish',
    'dinamarques': 'danish',
    'estoniano': 'estonian',
    'letão': 'latvian',
    'letao': 'latvian',
    'lituano': 'lithuanian',
    'eslovaco': 'slovak',
    'esloveno': 'slovenian',
    'servo': 'serbian',
    'catalão': 'catalan',
    'catalao': 'catalan',
    'vietnamita': 'vietnamese',
    'tailandês': 'thai',
    'tailandes': 'thai',
    'indonésio': 'indonesian',
    'indonesio': 'indonesian',
    'filipino': 'filipino',
    'malaio': 'malay',
    'persa': 'persian',
    'urdu': 'urdu',
    'bengali': 'bengali',
    'tâmil': 'tamil',
    'tamil': 'tamil',
    'telugu': 'telugu',
    'marata': 'marathi',
    'gujarati': 'gujarati',
    'canarês': 'kannada',
    'canarese': 'kannada',
    'panjabi': 'punjabi',
    'punjabi': 'punjabi',
    'malayalam': 'malayalam',
    'birmanês': 'burmese',
    'birmanes': 'burmese',
    'laosiano': 'lao',
    'cazaque': 'kazakh',
    'uzbeque': 'uzbek',
    'georgiano': 'georgian',
    'armênio': 'armenian',
    'armenio': 'armenian',
    'mongol': 'mongolian',
    'tibetano': 'tibetan',
    'nepalês': 'nepali',
    'nepales': 'nepali',
    'sinhala': 'sinhala',
    'cingalês': 'sinhala',
    'cingales': 'sinhala',
    'tagalo': 'tagalog',
    'swahili': 'swahili',
    'zulu': 'zulu',
    'xhosa': 'xhosa',
    'africâner': 'afrikaans',
    'africaner': 'afrikaans',
    'islandês': 'icelandic',
    'islandes': 'icelandic',
    'letão': 'latvian',
    'letao': 'latvian',
    'estoniano': 'estonian',
    'esloveno': 'slovenian',
    'eslovaco': 'slovak',
    'búlgaro': 'bulgarian',
    'bulgaro': 'bulgarian',
    'croata': 'croatian',
    'lituano': 'lithuanian',
    'romeno': 'romanian',
    'ucraniano': 'ukrainian',
    'tcheco': 'czech',
    'checo': 'czech',
    'eslovaco': 'slovak',
    'esloveno': 'slovenian',
    'servo': 'serbian',
    'catalão': 'catalan',
    'catalao': 'catalan',
    'vietnamita': 'vietnamese',
    'tailandês': 'thai',
    'tailandes': 'thai',
    'indonésio': 'indonesian',
    'indonesio': 'indonesian',
    'filipino': 'filipino',
    'malaio': 'malay',
    'persa': 'persian',
    'urdu': 'urdu',
    'bengali': 'bengali',
    'tâmil': 'tamil',
    'tamil': 'tamil',
    'telugu': 'telugu',
    'marata': 'marathi',
    'gujarati': 'gujarati',
    'canarês': 'kannada',
    'canarese': 'kannada',
    'panjabi': 'punjabi',
    'punjabi': 'punjabi',
    'malayalam': 'malayalam',
    'birmanês': 'burmese',
    'birmanes': 'burmese',
    'laosiano': 'lao',
    'cazaque': 'kazakh',
    'uzbeque': 'uzbek',
    'georgiano': 'georgian',
    'armênio': 'armenian',
    'armenio': 'armenian',
    'mongol': 'mongolian',
    'tibetano': 'tibetan',
    'nepalês': 'nepali',
    'nepales': 'nepali',
    'sinhala': 'sinhala',
    'cingalês': 'sinhala',
    'cingales': 'sinhala',
    'tagalo': 'tagalog',
    'swahili': 'swahili',
    'zulu': 'zulu',
    'xhosa': 'xhosa',
    'africâner': 'afrikaans',
    'africaner': 'afrikaans',
    'islandês': 'icelandic',
    'islandes': 'icelandic'
  };

  let idiomaNorm = idioma;
  if (idiomaMap[idioma]) {
    idiomaNorm = idiomaMap[idioma];
  }
  // Se o idioma não for reconhecido, avisa o usuário
  if (!idiomaNorm || idiomaNorm.length < 2) {
    await sock.sendMessage(chatId, { text: `❌ Idioma não reconhecido ou não suportado: "${idioma}". Tente usar o nome do idioma em português ou inglês.` }, { quoted: msg });
    return;
  }
  console.log('--- [lessonidioma] Idioma normalizado para prompt:', idiomaNorm);


  // Prompt dinâmico e detalhado para qualquer idioma




  let systemPrompt = fs.readFileSync(path.join(__dirname, 'idiomaPrompt.txt'), 'utf8');

  let userPrompt =  `Crie uma lição completa no idioma ${idioma}. Todas as seções (audio_text, text, pronuncia, vocab, questions_title, questions, answers) devem estar inteiramente em ${idioma}, nunca em inglês, exceto as traduções para o português no campo "meaning". Use inglês somente se o idioma‑alvo for inglês.`;
  if (nivel) userPrompt += ` O nível é ${nivel}.`;
  if (tema) userPrompt += ` O tema é "${tema}".`;
  userPrompt += ' Siga rigorosamente o formato e as instruções.';
  console.log('--- [lessonidioma] systemPrompt:', systemPrompt);
  console.log('--- [lessonidioma] userPrompt:', userPrompt);


  try {
    // Gera a lição (texto, vocabulário, questões, gabarito)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
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
    const respostaBruta = response.data.choices[0].message.content;
    console.log('--- [lessonidioma] Resposta bruta do modelo:', respostaBruta);
    const match = respostaBruta.match(/\{[\s\S]*\}/);
    if (!match) {
      await sock.sendMessage(chatId, { text: '❌ Não foi possível gerar a lição. Tente novamente.' }, { quoted: msg });
      return;
    }
    let lessonJson;
    try {
      lessonJson = JSON.parse(match[0]);
    } catch (e) {
      console.error('--- [lessonidioma] Erro ao fazer parse do JSON:', e, '\nConteúdo:', match[0]);
      await sock.sendMessage(chatId, { text: '❌ Erro ao processar a lição gerada.' }, { quoted: msg });
      return;
    }
    // Gera o áudio com o texto da lição (se idioma suportado pelo TTS)
    let audioPath = null;
    try {
      const ttsResp = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1-hd',
          input: lessonJson.audio_text,
          voice: 'nova',
          response_format: 'opus',
          speed: 1.0,
          language: idioma
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      audioPath = path.join(TMP_DIR, `lessonidioma_${Date.now()}.opus`);
      fs.writeFileSync(audioPath, Buffer.from(ttsResp.data));
    } catch (e) {
      console.error('--- [lessonidioma] Erro ao gerar áudio:', e);
      audioPath = null;
    }
    // Salva a última lição para tradução posterior
    const LAST_LESSON_PATH = path.join(__dirname, '..', 'last_lesson.json');
    fs.writeFileSync(LAST_LESSON_PATH, JSON.stringify(lessonJson, null, 2), 'utf8');
    // Monta a mensagem WhatsApp
    let msgText = `*Lição de ${idioma.charAt(0).toUpperCase() + idioma.slice(1)}*\n`;
    if (nivel) msgText += `*Nível:* ${nivel}\n`;
    if (tema) msgText += `*Tema:* ${tema}\n`;
    msgText += `\n*Texto:*\n${lessonJson.text}\n`;
    if (lessonJson.pronuncia && lessonJson.pronuncia.trim()) {
      msgText += `\n*Jeito de falar (pt-br):*\n${lessonJson.pronuncia}\n`;
    }
    msgText += `\n*Vocabulário:*\n`;
    (lessonJson.vocab || []).forEach(v => {
      msgText += `- *${v.word}*: ${v.meaning}\n`;
    });
    // Título dinâmico para exercícios
    const questionsTitle = lessonJson.questions_title || 'Exercícios';
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
}
module.exports = lessonIdiomaUniversalHandler;
