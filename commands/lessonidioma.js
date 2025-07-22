
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

  if (!idioma) {
    await sock.sendMessage(chatId, { text: 'Uso: !lessonidioma idioma: <idioma> [nivel: <nível>] [tema: <tema>]\nExemplos:\n!lessonidioma idioma: italiano nivel: B1 tema: viagens\n!lessonidioma nivel: Avançado tema: animais idioma: francês\n!lessonidioma tema: contabilidade idioma: mandarim nivel: intermediário' }, { quoted: msg });
    return;
  }


  // Prompt dinâmico e detalhado para qualquer idioma




  let systemPrompt = `Você é um professor de idiomas especializado em criar lições para WhatsApp. Sempre siga esta estrutura e estas regras, adaptando tudo para o idioma alvo: ${idioma.toUpperCase()}.\n\n` +
    `IMPORTANTE: Todas as partes da lição (texto, vocabulário, perguntas, respostas) devem estar em ${idioma.toUpperCase()}, NUNCA em inglês, exceto traduções para o português.\n` +
    `NÃO escreva nada em inglês, a menos que o idioma alvo seja inglês.\n` +
    `O texto da lição deve conter pelo menos um pequeno diálogo entre personagens, com falas marcadas por travessão ou aspas, para simular conversação real.\n` +
    `O texto deve ser adequado para leitura em voz alta por TTS.\n` +
    `Defina claramente um personagem ou narrador coerente (ex: "professora italiana simpática chamada Giulia" ou "professor francês animado chamado Pierre") e mantenha o mesmo estilo em todas as lições deste idioma.\n` +
    `Se possível, use um estilo de fala natural e acolhedor, como um professor de verdade.\n` +
    `Exemplo correto para italiano:\n- Texto: em italiano, com diálogo\n- Vocabulário: palavras em italiano, significado em português\n- Perguntas: enunciado e alternativas em italiano\n- Respostas: em italiano\nExemplo incorreto: qualquer parte em inglês.\n` +
    `1. [AUDIO]: Gere um texto curto, natural, interessante e com diálogo em ${idioma} para a lição (8-15 linhas), usando apenas vocabulário e gramática apropriados para o nível solicitado (${nivel || 'A1-C2'}) e tema (${tema || 'aleatório'}). O texto deve ser contextual, relevante e adequado ao nível e tema. Destaque palavras novas ou importantes com *asteriscos* (ex: *palavra*). NÃO use palavras ou estruturas acima do nível pedido.\n` +
    `2. [TEXT]: Forneça o mesmo texto do áudio, com as palavras destacadas por asteriscos.\n` +
    `3. [PRONUNCIA]: Se o idioma alvo não usa o alfabeto latino, forneça o texto do áudio também em uma versão "jeito de falar" (transliteração para português brasileiro, sílaba a sílaba, para facilitar a pronúncia). Se o idioma usa o alfabeto latino, deixe este campo vazio.\n` +
    `4. [VOCABULARY]: Liste todas as palavras destacadas, cada uma com uma definição simples em português brasileiro.\n` +
    `5. [QUESTIONS]: Crie de 4 a 6 exercícios curtos sobre o texto, variando entre completar, múltipla escolha, perguntas diretas, sinônimos/antônimos, etc. Use sempre o idioma alvo (${idioma}) nos enunciados e respostas, exceto quando pedir tradução.\n` +
    `6. [ANSWERS]: Dê a resposta correta para cada exercício.\n\n` +
    `Formate sua resposta como JSON, sem comentários ou explicações fora do JSON:\n` +
    `{"audio_text": "...", "text": "...", "pronuncia": "...", "vocab": [ { "word": "...", "meaning": "..." } ], "questions_title": "...", "questions": [ "..." ], "answers": [ "..." ]}`;

  let userPrompt = `Gere uma lição COMPLETA no idioma ${idioma}. Todas as partes devem estar em ${idioma}, nunca em inglês, exceto traduções para o português. NÃO use inglês em nenhuma parte da lição, exceto se o idioma alvo for inglês.`;
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
        model: 'gpt-4o',
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
          model: 'tts-1',
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
