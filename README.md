
# CNU Test Maker – WhatsApp Language & Exam Bot

> **Um bot profissional, modular e extensível para WhatsApp, focado em ensino de idiomas, geração de lições, questões de concurso, TTS, transcrição, tradução e integração com IA.**

---

## Visão Geral

O CNU Test Maker é um bot para WhatsApp que utiliza a API do OpenAI (GPT-4o, TTS, Whisper) para criar lições de idiomas, gerar questões de múltipla escolha no padrão FGV, traduzir, transcrever áudios, buscar vídeos no YouTube, responder perguntas com IA e muito mais. Ele é totalmente modular, fácil de instalar e seguro para uso pessoal ou em grupos.

---

## Principais Funcionalidades

- **Lições de Idiomas**: Gere lições completas em qualquer idioma, com áudio, vocabulário, exercícios e gabarito, adaptadas ao nível e tema desejados.
- **Questões de Concurso**: Crie blocos de questões objetivas no padrão FGV, com texto motivador, alternativas e gabarito.
- **Transcrição de Áudio**: Converta áudios do WhatsApp em texto usando o Whisper.
- **TTS (Texto para Fala)**: Converta qualquer mensagem de texto em áudio natural.
- **Tradução**: Traduza lições geradas para o português.
- **Busca no YouTube**: Pesquise vídeos diretamente do WhatsApp.
- **ChatGPT**: Faça perguntas abertas e receba respostas da IA.
- **Gerenciamento de tarefas e comandos utilitários**: Liste tarefas, mencione todos, veja comandos disponíveis, etc.

---

## Comandos Disponíveis

### !lesson
Gera uma lição de inglês com áudio, vocabulário e exercícios.
```
!lesson nivel:<nível> tema:<tema>
Exemplo: !lesson nivel:B1 tema:travel
```

### !lessonidioma
Gera uma lição em qualquer idioma, com áudio (se suportado), vocabulário, exercícios e transliteração (se necessário).
```
!lessonidioma idioma:<idioma> [nivel:<nível>] [tema:<tema>]
Exemplo: !lessonidioma idioma: italiano nivel: B1 tema: viagens
Exemplo: !lessonidioma nivel: Avançado tema: animais idioma: francês
Exemplo: !lessonidioma tema: contabilidade idioma: mandarim nivel: intermediário
```

### !questoes
Gera questões de múltipla escolha no padrão FGV.
```
!questoes <tema> <nível> <quantidade>
Exemplo: !questoes verbos básico 5
```

### !gabarito
Mostra o gabarito das questões pendentes do chat.
```
!gabarito
```

### !traduz
Traduz a última lição gerada para português.
```
!traduz
```

### !speech
Converte uma mensagem de texto citada em áudio (TTS).
```
Responda a uma mensagem de texto com !speech
```

### !trans
Transcreve um áudio citado para texto.
```
Responda a um áudio com !trans
```

### !gpt
Pergunte qualquer coisa para o ChatGPT.
```
!gpt Qual a capital da França?
```

### !yt
Busca vídeos no YouTube.
```
!yt beatles help
```

### !todos
Menciona todos os membros do grupo.
```
!todos [mensagem opcional]
```

### !comandos
Lista todos os comandos e exemplos de uso.
```
!comandos
```

---

## Instalação e Execução (Windows, Mac, Linux)

### 1. Pré-requisitos
- Node.js 18 ou superior ([download](https://nodejs.org/))
- Conta OpenAI com API Key
- WhatsApp (número para uso do bot)

### 2. Clone o repositório
```sh
git clone https://github.com/seu-usuario/cnu-test-maker.git
cd cnu-test-maker
```

### 3. Instale as dependências
```sh
npm install
```

### 4. Configure sua OpenAI API Key
- Crie um arquivo `.env` na raiz:
  ```
  OPENAI_API_KEY=sua-chave-aqui
  ```
- Ou edite o arquivo `utils/openaiKey.js` para retornar sua chave.

### 5. Inicie o bot
```sh
node whatsapp-bot.js
```

### 6. Conecte o WhatsApp
Escaneie o QR Code exibido no terminal para conectar sua conta.

---

## Estrutura de Pastas

- `commands/` – Todos os comandos do bot (cada comando em um arquivo separado)
- `utils/` – Utilitários e helpers (inclui openaiKey.js)
- `auth_info/` – Arquivos de autenticação do WhatsApp (NÃO subir para o GitHub)
- `tmp/` – Arquivos temporários (áudios, etc.)
- `banco_questoes.json` – Banco de questões geradas
- `questoes_pendentes.json` – Rastreamento de questões pendentes por chat
- `last_lesson.json` – Última lição gerada (para tradução)

---

## Segurança e Privacidade

- **NUNCA** suba arquivos sensíveis como `auth_info/`, `openai.key`, `.env`, `utils/openaiKey.js` para o GitHub.
- O `.gitignore` já está configurado para proteger esses arquivos.

---

## Personalização

- Para adicionar ou modificar comandos, edite ou crie arquivos em `commands/`.
- O bot é facilmente extensível para novas funções.

---

## Licença

MIT
