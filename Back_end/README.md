# Back_end - WhatsApp Web Clone

Este README contém as instruções para configurar e executar o Back_end do projeto WhatsApp Web Clone, que é um servidor serverless desenvolvido com Google Cloud Functions e integrações com IA Gemini e Google Cloud Tasks.

## Como Obter a API Key do Gemini

Para obter a API key do Gemini, siga os seguintes passos:

1. Acesse o Google AI Studio: [https://aistudio.google.com/](https://aistudio.google.com/).
2. Crie a chave em "Get API Key". O site fornecerá instruções detalhadas sobre como proceder.

## Pré-requisitos

1. **Separação das Funções em Cloud Functions**: Certifique-se de que as funções `Task`, `IA_Process`, `arquivos_gemini` e `audio` estejam configuradas em Cloud Functions separadas, para garantir uma melhor organização e escalabilidade do sistema.

2. **Configurar o Meta API**: Siga a documentação oficial do Meta para configurar a API do WhatsApp Cloud: [Meta WhatsApp Cloud API - Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started).

3. **Ativar Google Cloud Tasks**: Certifique-se de que o Google Cloud Tasks esteja ativado no seu projeto do Google Cloud para garantir o funcionamento correto das tarefas assíncronas.

4. **Ativar Google Firestore e Google Cloud Storage**: Certifique-se de que o Google Firestore e o Google Cloud Storage estejam ativados no seu projeto do Google Cloud para armazenar mensagens, áudios, imagens, vídeos e outros arquivos enviados pelos clientes.
   
5. **Configurar o Firestore**: ## Configuração do Firestore

1. **Crie as Coleções Essenciais:** Acesse o console do Firestore e crie as seguintes coleções:

   - **`history_w_ia` (Obrigatória):** Armazenará o histórico de mensagens e informações dos clientes. 

   - **`w_s_ia` (Opcional):** Utilize esta coleção para armazenar configurações da IA, como prompts e exemplos de treinamento.

2. **Estrutura das Coleções:**  A interface e descrição detalhada de cada coleção, incluindo os campos e tipos de dados, estão disponíveis no [README principal](../README.md). Consulte a seção "Estrutura do Projeto (Firestore)" para obter informações completas sobre como organizar seus dados. 


6. **Configuração do Ambiente**: Após configurar a API do WhatsApp, insira os valores dos tokens e outras credenciais como variáveis de ambiente diretamente na configuração ENV, variáveis de ambiente, do Google Cloud Functions ao criar a função. Local da ENV [.env.local](./servidores/.env.local)

## Função [Task](./servidores/servidor%20task/Task.js) :

A principal função criada é o `Task.js`, responsável por gerenciar as interações iniciais e o processamento de mensagens.

### Funcionamento do Código Task

- **Verificação de Requisições**: A função `Task.js` é responsável por processar requisições recebidas.
  - **Método GET**: Caso a requisição recebida seja um `GET`, a função lida com a verificação, conforme descrito na documentação oficial do Meta.
  - **Método POST**: Caso seja um `POST`, o servidor já está configurado para receber as mensagens enviadas pelos clientes e criar tarefas no Google Cloud Tasks.

## Pacotes e Dependências

```json
   {
   "dependencies": {
      "@google-cloud/functions-framework": "^3.0.0",
      "@google-cloud/tasks" : "*",
      "firebase-admin": "^9.0.0"

   }
   }
```
## Pasta [IA_Process](./servidores/servidor%20IA_Process/)

A função `Servidor_IA_Process` é responsável por receber as tarefas criadas pela função `Task.js`. Ela processa diferentes tipos de mensagens, incluindo texto, imagens, áudios e arquivos, e decide se deve responder ao cliente ou apenas armazenar a mensagem.

Dentro da `Servidor_IA_Process`, existem 7 funções principais:

1. **respostaCliente**: Esta função envia a resposta para o WhatsApp do cliente e marca a mensagem como lida.

2. **funcao_inicial_bloq**: Verifica se o cliente está marcado como bloqueado no servidor. Se o cliente estiver bloqueado, a função impede que a IA responda e encerra a requisição.

3. **funcao_principal**: É a função responsável por enviar a resposta ao cliente. Dentro dela, são chamadas quatro IAs diferentes:

   - **IA 1 (generateContent)**: Verifica se a pergunta do cliente está relacionada à empresa. Esta IA utiliza a API `generateContent` do Google, que recebe exemplos de como responder em formato JSON, lembre-se de criar esses exemplos com os dados da sua empresa para melhor qualidade da verificação. Para isso, coloque a entrada como input(com seus exemplos de entrada), output(resposta da IA no formato: `{bloqueio: false || true}`) como JSON. Caso o retorno da IA indique `{bloqueio: true}`, o cliente recebe uma mensagem informando que sua pergunta não está relacionada à empresa. Após três advertências, o cliente é bloqueado e só pode ser desbloqueado por um funcionário da empresa.
   - **IA 2**: Caso a mensagem seja um arquivo de áudio, imagem ou vídeo, esta IA cria uma transcrição para salvar no histórico do chat da IA, sem precisar anexar o conteúdo original em cada interação, o que aumenta a velocidade de resposta.
   - **IA 3**: Gera a resposta ao cliente, que pode ser em formato de texto, áudio, imagem ou vídeo, dependendo da solicitação.
   - **IA 4**: Verifica se o cliente está solicitando suporte humano. Utilizando o histórico da conversa, se a IA identificar a necessidade de suporte, ela automaticamente bloqueia o cliente e chama o suporte humano. O formato é `{bloqueio: false || true}`.
   - 
Além disso, esta função também considera o horário de atendimento humano, definido no final do código. Certifique-se de ajustar este horário de acordo com o seu projeto.

4. **sendEmail**: Esta função notifica por e-mail um funcionário da empresa quando os clientes são bloqueados pelo sistema.

5. **uploadToBucket**: Responsável por salvar arquivos de áudio, imagem e vídeo no Google Cloud Storage e retornar uma URL.

6. **funcSalvarServidor_arquivos**: Utiliza a função `uploadToBucket` para salvar arquivos no Google Cloud Storage e retorna uma URL.

7. **salvar_servidor**: Salva as mensagens no banco de dados corretamente. Para mensagens de texto, o conteúdo é salvo diretamente, enquanto arquivos de mídia (áudios, imagens, vídeos) são salvos como URLs geradas pelas funções anteriores.

A próxima função dentro da pastaé o `Gemini_response`, que é simplesmente onde as IAs estão configuradas. Nessa função, são feitas as perguntas para o Gemini. A função seguinte, dentro da pasta, é o `Prompts_gerais`, onde estão os prompts para enviar para a IA como systemInstruction do Gemini, existe um map dentro da função para colocar dados do seu firestorage como documentos (doc) e perguntas exemplos (perg), coloque seus dados e documentos, separando por title(título do documento) e content (conteudo do documento), exemplo: configuração do array : [{title:'',content:''},{title:'',content:''}...]. Ali textos exemplos que utilizei para a empresa Allnec, mude e coloque o seu.
## Pacotes e Dependências

```json
   {
   "dependencies": {
      "@google-cloud/functions-framework": "^3.0.0",
      "axios":"^1.4.0",
      "firebase-admin": "^9.0.0",
      "@google/generative-ai": "^0.11.4",
      "nodemailer":"*",
      "@google-cloud/storage" : "^6.10.0",
      "moment-timezone": "*",
      "uuid-v4" : "*"

   }
   }
```
## Função [arquivos_gemini](./servidores/gemini/arquivos_gemini.js) :

A função `arquivos_gemini` é responsável por fazer o upload de arquivos de áudio, imagem e vídeo para o Gemini, pois não é possível enviar esses arquivos diretamente no chat da IA. Primeiro, o arquivo é enviado para o Gemini, que retorna uma URI e um mimetype. Com esses dados, é possível enviar a solicitação ao chat da IA para obter uma resposta com arquivos de  áudio, imagem e vídeo.

## Pacotes e Dependências

```json
{
  "dependencies": {
    "@google-cloud/functions-framework": "^3.0.0",
    "axios": "^1.4.0",
    "firebase-admin": "^9.0.0",
    "@google/generative-ai": "^0.11.4",
    "nodemailer": "*",
    "@google-cloud/storage": "^6.10.0",
    "moment-timezone": "*",
    "uuid-v4": "*"
  }
}
```
## Função [audio](./servidores/Servidor_arquivos/audio.js)

A função `audio.js` é responsável por receber o áudio gravado no front-end no formato WebM e convertê-lo para o formato MP3, que é aceito pela API do WhatsApp.

### Funcionamento da Função `audio`

1. **Recebimento do Áudio**: A função recebe o áudio enviado pelo Front_End no formato WebM.
2. **Conversão para MP3**: Utilizando uma biblioteca de conversão de áudio, a função converte o arquivo WebM recebido para o formato MP3.
3. **Armazenamento no Cloud Storage**: O arquivo MP3 é então armazenado no Google Cloud Storage para que possa ser acessado posteriormente.
4. **Retorno da URL**: A função retorna a URL pública do arquivo MP3 armazenado no Cloud Storage.

### Pacotes e Dependências

```json
   {
   "dependencies": {
      "@google-cloud/functions-framework": "^3.0.0",
      "@google-cloud/storage": "*",
      "cors" : "*",
      "uuid-v4" : "*",
      "fluent-ffmpeg": "*",
      "ffmpeg-static" : "*"
   }
   }
```

1. **@google-cloud/storage**: Essa biblioteca é utilizada para interagir com o Google Cloud Storage e armazenar o arquivo MP3 convertido.
2. **fluent-ffmpeg**: Essa biblioteca é responsável pela conversão do áudio do formato WebM para MP3.
3. **uuid-v4**: Essa biblioteca gera identificadores únicos universais (UUIDs) para nomear os arquivos de áudio de forma única.


## Configuração do Cloud Functions

Para implementar a função no Google Cloud, siga os seguintes passos:

1. **Deploy no Google Cloud Functions**:

   - Certifique-se de que as credenciais da sua conta Google Cloud estão configuradas.
   - Execute o deploy da função usando o Google Cloud CLI

2. **Configuração do Cloud Tasks**:

   - Configure a fila de tarefas no Google Cloud Tasks para gerenciar o processamento de mensagens de forma assíncrona.

## Tecnologias Utilizadas

- **Node.js** para desenvolvimento da função serverless.
- **Google Cloud Functions** para hospedar o backend de maneira escalável.
- **Google Cloud Tasks** para gerenciar o processamento sequencial de mensagens.
- **API WhatsApp Cloud (Meta)** para integração de mensagens via WhatsApp.
- **Google Firestore** para armazenamento das mensagens.
- **Google Cloud Storage** para armazenamento de áudios, imagens, vídeos e outros arquivos enviados pelos clientes.

---

Este README descreve como configurar e implementar o Back_end do projeto WhatsApp Web Clone. Para mais detalhes sobre o Front_end, consulte o [README do Front_end](../Front_end/README.md).

