const fs = require('fs');
const path = require('path');
const { getOpenAiApiKey } = require('../utils/openaiKey');
const axios = require('axios');

const QUESTIONS_DB = path.join(__dirname, '..', 'banco_questoes.json');
const TRACKING_DB = path.join(__dirname, '..', 'questoes_pendentes.json');
function loadTracking() {
  if (fs.existsSync(TRACKING_DB)) {
    return JSON.parse(fs.readFileSync(TRACKING_DB, 'utf8'));
  }
  return {};
}

function saveTracking(tracking) {
  fs.writeFileSync(TRACKING_DB, JSON.stringify(tracking, null, 2), 'utf8');
}

function loadQuestions() {
  if (fs.existsSync(QUESTIONS_DB)) {
    return JSON.parse(fs.readFileSync(QUESTIONS_DB, 'utf8'));
  }
  return [];
}

function saveQuestions(questions) {
  fs.writeFileSync(QUESTIONS_DB, JSON.stringify(questions, null, 2), 'utf8');
}

function generateId(existingIds = new Set()) {
  // Gera um id curto: Q + 6 caracteres alfanuméricos, garantindo unicidade global
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id;
  do {
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    id = 'Q' + rand;
  } while (existingIds.has(id));
  return id;
}

const SYSTEM_PROMPT = `Você é um gerador de questões objetivas desafiadoras para concursos, simulando rigorosamente o padrão da banca FGV (Fundação Getulio Vargas). Sempre siga as instruções abaixo:

1. Gere um texto base (motivador) coerente com o tema solicitado, que sirva de apoio para a elaboração das questões, simulando o estilo de textos utilizados pela FGV:
   - Para temas de linguagens, humanas ou literatura, utilize um texto de gênero variado (poema, crônica, artigo, trecho literário, etc.), de 15 a 25 linhas, que permita a elaboração de questões sobre análise sintática, interpretação, gramática, literatura, etc. O texto não precisa ser sobre o tema, mas deve conter elementos que possibilitem questões relacionadas ao tema solicitado.
   - Para temas de exatas ou ciências da natureza, utilize um texto mais conciso, técnico ou contextual, que sirva de apoio para questões de cálculo, análise, interpretação de dados, ou aplicação de conceitos.
   - O texto deve ser inédito, criativo, relevante e adequado ao padrão FGV.

2. Elabore 5 questões objetivas inéditas, desafiadoras e contextualizadas, no padrão FGV, baseadas no texto motivador e/ou no tema solicitado. As questões devem exigir raciocínio, análise e interpretação, e não podem ser triviais.
   - Cada questão deve ter 5 alternativas (a)-(e), apenas uma correta. As alternativas erradas devem ser plausíveis e bem elaboradas.
   - O enunciado deve ser claro, preciso e, quando possível, citar trechos do texto motivador.
   - As questões devem abordar diferentes aspectos do tema/texto, simulando a diversidade e dificuldade das provas FGV.

3. Para cada questão, gere um campo 'id' curto no formato Q + 6 caracteres alfanuméricos (ex: Q4F7Z2A).

4. Ao final, retorne um JSON com o seguinte formato, sem comentários ou explicações:
{
  "tema": "...",
  "texto_base": "...",
  "questoes": [
    {
      "id": "Q4F7Z2A",
      "enunciado": "...",
      "opcoes": {"a": "...", "b": "...", "c": "...", "d": "...", "e": "..."},
      "gabarito": "a"
    },
    ...
  ]
}

Lembre-se: as questões devem ser realmente difíceis, criativas e no padrão FGV, e o texto motivador deve ser adequado ao tipo de tema solicitado, servindo de base para as questões.
`;

module.exports = async function handleQuestoesCommand({ text, chatId, sock, msg }) {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    await sock.sendMessage(chatId, { text: '❌ API Key do OpenAI não configurada.' }, { quoted: msg });
    return;
  }
  // Permite variações: !questoes, !questões, !QUESTOES, !Questões, etc., com ou sem acento, qualquer caixa
  // Usa Unicode e aceita qualquer variação de o/õ/Ô/Õ, etc.
  const regex = /!ques(?:t[oóõôöòṍÕÓÔÖÒ])?es\s+tema\s*:\s*(.+)/iu;
  const temaMatch = text.match(regex);
  if (!temaMatch) {
    await sock.sendMessage(chatId, { text: 'Envie o comando assim: !questoes tema: [tema desejado]' }, { quoted: msg });
    return;
  }
  const tema = temaMatch[1].trim();
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Tema: ${tema}` }
        ],
        max_tokens: 3000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // Tenta extrair o JSON da resposta
    const match = response.data.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (!match) {
      await sock.sendMessage(chatId, { text: '❌ Não foi possível gerar as questões. Tente novamente.' }, { quoted: msg });
      return;
    }
    let questoesJson;
    try {
      questoesJson = JSON.parse(match[0]);
    } catch (e) {
      await sock.sendMessage(chatId, { text: '❌ Erro ao processar as questões geradas. Tente novamente.' }, { quoted: msg });
      return;
    }
    // Carrega banco e IDs existentes
    const banco = loadQuestions();
    const existingIds = new Set();
    const existingEnunciados = new Set();
    banco.forEach(bloco => {
      bloco.questoes.forEach(q => {
        existingIds.add(q.id);
        existingEnunciados.add(q.enunciado.trim());
      });
    });
    // Gera IDs únicos e filtra questões duplicadas
    const novasQuestoes = [];
    questoesJson.questoes.forEach(q => {
      // Garante unicidade de enunciado e id
      if (!q.id || existingIds.has(q.id)) {
        q.id = generateId(existingIds);
      }
      if (!existingEnunciados.has(q.enunciado.trim())) {
        novasQuestoes.push(q);
        existingIds.add(q.id);
        existingEnunciados.add(q.enunciado.trim());
      }
    });
    if (!novasQuestoes.length) {
      await sock.sendMessage(chatId, { text: 'Nenhuma nova questão foi adicionada (todas já existem no banco).' }, { quoted: msg });
      return;
    }
    // Verifica se já existe bloco igual de tema/texto_base
    let bloco = banco.find(b => b.tema === questoesJson.tema && b.texto_base === questoesJson.texto_base);
    if (bloco) {
      bloco.questoes.push(...novasQuestoes);
    } else {
      banco.push({
        tema: questoesJson.tema,
        texto_base: questoesJson.texto_base,
        questoes: novasQuestoes
      });
    }
    saveQuestions(banco);
    // Rastreia questões pendentes por chatId
    const tracking = loadTracking();
    if (!tracking[chatId]) tracking[chatId] = [];
    novasQuestoes.forEach(q => tracking[chatId].push(q.id));
    saveTracking(tracking);
    // Monta resposta para o WhatsApp (sem gabarito)
    let reply = `*Tema:* ${questoesJson.tema}\n\n*Texto base:*\n${questoesJson.texto_base}\n\n*Questões:*\n`;
    novasQuestoes.forEach((q, i) => {
      reply += `\n${i + 1}. ${q.enunciado}\n`;
      for (const letra of ['a','b','c','d','e']) {
        reply += `   (${letra}) ${q.opcoes[letra]}\n`;
      }
    });
    await sock.sendMessage(chatId, { text: reply }, { quoted: msg });
  } catch (error) {
    console.error('Erro ao gerar questões:', error?.response?.data || error);
    await sock.sendMessage(chatId, { text: '❌ Ocorreu um erro ao gerar as questões.' }, { quoted: msg });
  }
};
