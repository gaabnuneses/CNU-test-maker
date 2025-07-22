const fs = require('fs');
const path = require('path');

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

/**
 * Comando !gabarito
 * Mostra todos os gabaritos pendentes do chat e reseta o rastreamento.
 */
module.exports = async function handleGabaritoCommand({ text, chatId, sock, msg }) {
  const tracking = loadTracking();
  const pendentes = tracking[chatId] || [];
  if (!pendentes.length) {
    await sock.sendMessage(chatId, { text: 'Não há gabaritos pendentes para este chat.' }, { quoted: msg });
    return;
  }
  const banco = loadQuestions();
  let replies = [];
  for (const id of pendentes) {
    let found = null;
    for (const bloco of banco) {
      for (const questao of bloco.questoes) {
        if (questao.id === id) {
          found = {
            tema: bloco.tema,
            texto_base: bloco.texto_base,
            ...questao
          };
          break;
        }
      }
      if (found) break;
    }
    if (found) {
      let reply = `*Gabarito da questão ${found.id}:*\n`;
      reply += `*Tema:* ${found.tema}\n`;
      reply += `*Enunciado:* ${found.enunciado}\n`;
      for (const letra of ['a','b','c','d','e']) {
        reply += `   (${letra}) ${found.opcoes[letra]}\n`;
      }
      reply += `\n*Resposta correta:* (${found.gabarito})`;
      replies.push(reply);
    }
  }
  if (!replies.length) {
    await sock.sendMessage(chatId, { text: '❌ Não encontrei gabaritos para as questões pendentes.' }, { quoted: msg });
    return;
  }
  // Envia todos os gabaritos em uma ou mais mensagens
  for (const rep of replies) {
    await sock.sendMessage(chatId, { text: rep }, { quoted: msg });
  }
  // Limpa o rastreamento para o chat
  tracking[chatId] = [];
  saveTracking(tracking);
};
