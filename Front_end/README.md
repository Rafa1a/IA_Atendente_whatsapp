# Front_end - WhatsApp Web Clone

Este README contém as instruções para configurar e executar o Front_end do projeto WhatsApp Web Clone. O frontend foi desenvolvido em Next.js utilizando TypeScript, proporcionando uma interface que simula o WhatsApp Web, integrada ao backend com funcionalidades avançadas, como respostas automáticas e armazenamento de mídia.

## Pré-requisitos

1. **Cadastro no Firebase**: Crie uma conta no Firebase seguindo a documentação oficial: [Firebase - Documentação](https://firebase.google.com/).

2. **Vincular ao Google Cloud**: Vincule a conta do Firebase ao projeto no Google Cloud utilizado no Back_end, ou crie um novo projeto do zero. Essa integração permite que o frontend e backend trabalhem de forma sincronizada.

3. **Configuração do Ambiente**: Existe um arquivo `.env.local` no diretório raiz do projeto Next.js. Nesse arquivo, insira as credenciais do Firebase obtidas após a criação do projeto no Firebase Console. Essas credenciais são essenciais para a conexão do frontend com o Firestore e Storage.

4. **Configuração das Coleções Firestore**: Configure as coleções `history_w_ia` e `w_s_ia` no Firestore. Essas coleções são descritas no README principal do projeto e são importantes para o armazenamento das conversas, mensagens e prompts da IA. [README principal](../README.md)

5. **Ativar Firestore e Cloud Storage**: No Firebase Console, ative o Firestore para o armazenamento de mensagens e o Cloud Storage para o armazenamento de arquivos de mídia, como áudios, imagens e vídeos. Você também pode ativar esses serviços diretamente pelo Google Cloud Console, se preferir.

## Estrutura do Projeto

O frontend do projeto é desenvolvido em Next.js e utiliza TypeScript para garantir maior segurança e tipagem durante o desenvolvimento. A estrutura é composta pelos seguintes diretórios principais:

- **App**: Contém os componentes principais do projeto, incluindo a inicialização do aplicativo e o arquivo `globals.css` com os estilos globais.
- **Auth**: Gerencia a autenticação do usuário com o Firebase.
- **Components**: Abriga todos os componentes reutilizáveis da interface, como a lista de mensagens, botões e campos de entrada de texto.
- **Interface**: Armazena a interface do sistema.
- **lib**: Contém utilitários e funções auxiliares.
- **Providers**: Fornece os provedores de contexto para Redux e temas.
- **Redux**: Estrutura a lógica de gerenciamento de estado do aplicativo com Redux. 

## Configuração do ENV

1. **Configurar Variáveis de Ambiente**: Adicione as seguintes variáveis ao arquivo `.env.local`, lembre-se você precisa colocar seus dados para funcionar:
   ```env
    # Whatsapp :
    GRAPH_API_TOKEN=GRAPH_API_TOKEN
    # Firebase :
    FIREBASE_API_KEY=FIREBASE_API_KEY
    FIREBASE_AUTH_DOMAIN=FIREBASE_AUTH_DOMAIN
    FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID
    FIREBASE_STORAGE_BUCKET=FIREBASE_STORAGE_BUCKET
    FIREBASE_MESSAGING_SENDER_ID=FIREBASE_MESSAGING_SENDER_ID
    FIREBASE_APP_ID=FIREBASE_APP_ID
   ```
   -   O `GRAPH_API_TOKEN` é essencial para enviar a mensagem. 
   -   E as credencias do firebase para autenticação, firestore e storage.
   -   Coloque **Seus dados para o funcionamento**.

## Como Executar o Projeto

1. **Entrar na pasta do Projeto**: Primeiro, entre na pasta do projeto:
   ```bash
   cd Front_end/whatsapp
   ```

2. **Instalar Dependências**: Instale todas as dependências necessárias para o projeto:
   ```bash
   npm install
   ```

3. **Executar o Servidor de Desenvolvimento**: Inicie o servidor de desenvolvimento local com o seguinte comando:
   ```bash
   npm run dev
   ```

4. **Acessar o Projeto**: Abra o navegador e acesse `http://localhost:3000` para visualizar o aplicativo.

## Funcionalidades do Frontend

- **Suporte a Temas Claro e Escuro**: Utiliza o pacote `next-themes` para permitir que o usuário alterne entre o modo claro e escuro, oferecendo uma experiência personalizada.
- **Ícones de Alta Qualidade**: O projeto utiliza `Lucide React` para fornecer ícones modernos e consistentes em toda a interface.
- **Componentes Pré-criados com shadcn/ui**: O frontend faz uso dos componentes oferecidos pela biblioteca `shadcn/ui` para agilizar o desenvolvimento e garantir consistência visual.
- **Gerenciamento de Estado com Redux Toolkit**: O frontend utiliza o Redux Toolkit para gerenciar o estado global do aplicativo, proporcionando uma experiência mais consistente e eficiente durante o uso.

- **Notificação com Service Worker (SW)**: O frontend utiliza Service Workers para enviar notificações aos usuários quando uma nova mensagem chega, mesmo que o navegador esteja minimizado ou em segundo plano, garantindo que o usuário esteja sempre informado sobre novas mensagens.

- **Integração em Tempo Real**: Utiliza `onSnapshot` do Firestore para sincronizar mensagens em tempo real entre os clientes e a interface de usuário.
- **Controle Manual da IA**: Permite que o usuário desative as respostas automáticas da IA para clientes específicos, garantindo maior controle sobre as interações.
- **Interface de Chat**: Simula a interface do WhatsApp Web, permitindo o envio de mensagens de texto, áudio, imagem e vídeo.
- **Armazenamento de Mídia**: Utiliza o Firebase Storage para armazenar mídias enviadas pelos clientes, como áudios, imagens, vídeos e documentos.

## Tecnologias Utilizadas

- **Redux Toolkit**: Utilizado para gerenciar o estado global do aplicativo, facilitando o compartilhamento de dados entre componentes e garantindo uma melhor organização do estado.
- **Next.js** para desenvolvimento da interface do usuário.
- **TypeScript** para garantir tipagem estática e maior segurança durante o desenvolvimento.
- **Firebase** para autenticação, Firestore para armazenamento de dados e Storage para armazenamento de mídia.
- **Tailwind CSS**: Utilizado para estilizar o aplicativo de forma rápida e consistente, proporcionando uma interface moderna e responsiva.
- **next-themes**: Utilizado para implementar o suporte a temas claros e escuros, permitindo alternar entre modos light e dark.
- **Lucide React**: Biblioteca de ícones utilizada no projeto para fornecer ícones de alta qualidade. [Lucide Icons](https://lucide.dev/).
- **shadcn/ui**: Componentes pré-criados utilizados para agilizar o desenvolvimento de interfaces e manter a consistência visual do projeto. [shadcn/ui](https://ui.shadcn.com/).

## Contribuição

Contribuições são bem-vindas! Caso encontre problemas ou deseje sugerir melhorias, fique à vontade para abrir issues ou pull requests.

---

Este README descreve como configurar e implementar o Front_end do projeto WhatsApp Web Clone. Para mais detalhes sobre o Back_end, consulte o [README do Back_end](../Back_end/README.md).

