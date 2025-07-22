// commands/comandos.js
module.exports = async function handleComandosCommand({ chatId, sock, msg }) {
    const helpText = `*Comandos disponíveis:*

*!ping*
Testa se o bot está online.
_Exemplo: !ping_

*!lastfm* <usuário>
Mostra informações do Last.fm.
_Exemplo: !lastfm nome_do_usuario_

*!yt* <termo>
Busca vídeos no YouTube.
_Exemplo: !yt beatles help_

*!todos*
Lista tarefas.
_Exemplo: !todos_

*!gpt* <pergunta>
Faz uma pergunta ao ChatGPT.
_Exemplo: !gpt Qual a capital da França?_

*!trans*
Transcreve áudio para texto.
_Exemplo: envie um áudio e digite !trans_

*!questoes* <tema> <nível> <quantidade>
Gera questões de múltipla escolha. Parâmetros devem ser dados nesta ordem:
<tema> (ex: verbos), <nível> (básico, intermediário, avançado), <quantidade> (número de questões)
_Exemplo: !questoes verbos básico 5_

*!gabarito*
Mostra o gabarito das questões pendentes.
_Exemplo: !gabarito_

*!speech*
Responda a uma mensagem de texto com este comando para converter em áudio.
_Exemplo: responda a uma mensagem e digite !speech_


*!lesson* <nível> <tema>
Gera uma lição de inglês com áudio, vocabulário e exercícios. Parâmetros devem ser dados nesta ordem:
<nível> (básico, intermediário, avançado), <tema> (ex: viagens, trabalho)
_Exemplo: !lesson intermediário viagens_

*!lessonidioma* <idioma> nivel:<nível> tema:<tema>
Gera uma lição no idioma escolhido, com áudio (se suportado), vocabulário, exercícios e, se necessário, o "jeito de falar" (transliteração para pt-br). Parâmetros:
<idioma> (ex: russo, japonês, espanhol), nivel:<nível> (A1, A2, B1, B2, C1, C2), tema:<tema> (ex: compras, viagens)
_Exemplo: !lessonidioma russo nivel:A1 tema:compras_

*!traduz*
Traduz a última lição gerada para português.
_Exemplo: !traduz_

*!comandos*
Lista todos os comandos e como usá-los.
_Exemplo: !comandos_

*Como usar:* Digite o comando desejado no chat. Alguns comandos exigem parâmetros, como *yt* ou *gpt*. Para comandos de áudio, responda a uma mensagem de texto com o comando.
`;
    await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
};
