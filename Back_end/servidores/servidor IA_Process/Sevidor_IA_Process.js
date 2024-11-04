const functions = require('@google-cloud/functions-framework');
const axios = require('axios');
const ge= require('./gemini');
const prompts = require('./prompts');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
const uuid = require('uuid-v4');
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

const bucketName = 'seu_bucket_aqui.appspot.com';
admin.initializeApp();

//Token do whatsapp :
const GRAPH_API_TOKEN = process.env.GRAPH_API_TOKEN;
//primeira mensagem que a IA manda mensagem de abertura da conversa. 
const msg = `Olá! Sou a IA da Nome_da_empresa, treinada com um alto nível de conhecimento técnico e pronta para responder às suas perguntas. Envie uma mensagem de cada vez e aguarde minha resposta.\n\nA IA tem o atendimento 24horas.\n\nPara suporte técnico (humano), peça pelo suporte.\n\nNosso horário de atendimento suporte técnico é de segunda a sexta das 8:30 às 12:00 e das 13:30 às 17:30.\n\nVamos começar?`;

// Função HTTP para lidar com o webhook
functions.http('whatsappWebhook', async (req, res) => {
    ///////////////////////FUNÇÕES/////////////////////////////////////////////////////////////////////////////////////
    const resposta_cliente = async(ia_response,business_phone_number_id,message) =>{
         // Envia uma resposta
         await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
            headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
            messaging_product: 'whatsapp',
            to: message.from,
            text: { body: ia_response },
            context: {
                message_id: message.id,
            },
            },
        });

        // Marca a mensagem recebida como lida
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
            headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: message.id,
            },
        });
    }
    let servidorAtivo = true;
    const funcao_inicial_bloq = async (message,history_cliente,business_phone_number_id) => {
       
        //////////////BLOQUEAR CLIENTES TRUE ou DESBLOUEAR DE ACORDO COM A HORA

        if (history_cliente && (history_cliente.bloqueio_ia || history_cliente.bloqueio_user)) {
            res.sendStatus(200);
            servidorAtivo = false;
            return;
        }
        
        /////////////////////////AGUARDE////////////////
        // Envia uma resposta de espera para aguardar
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
            headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
            messaging_product: 'whatsapp',
            to: message.from,
            text: { body: "Aguarde..." },
            context: {
                message_id: message.id,
            },
            },
        });
        
    }
    const funcao_principal = async(transaction,message, docref_id_phone_history, history_cliente, business_phone_number_id, arquivo_url, audio_boolean, image_boolean, video_boolean, caption) =>{
        //salvar audio servidor: 
        // if(type === 'text'){
        //     await salvar_servidor(docref_id_phone_history,history_cliente,type,message.text.body,'user')
        // }else if(type === 'audio' || type === 'image' || type === 'video' || type === 'document'){
        //     await salvar_servidor(docref_id_phone_history,history_cliente,type,arquivo_url,'user',mime_type)
        // }
        const nome_cliente = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name;
        const phone_number = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id;
        //////////BLOQUEIOS suporte e perguntas nao relacionadas:
        const db_prompts_genereteds = admin.firestore().collection('w_s_ia').doc('prompts');
        const getdoc_prompts_genereteds = await db_prompts_genereteds.get();
        const data_prompts_genereteds = getdoc_prompts_genereteds.data();
        // acessando dados
        const array_prompts_perg_bloqueio = data_prompts_genereteds && data_prompts_genereteds.bloqueio_perg ? data_prompts_genereteds.bloqueio_perg : [];
        const prompt_perg_bloqueio = prompts.prompt_perg_bloqueio()

        ///////////////// MUDA/////////////////////////////////////////////
        //tratamento para passar os dados corretos para  ia texto, audio, imagem e video
        let text_arquivo 
        if(audio_boolean){
            text_arquivo = arquivo_url;
        } else if (image_boolean){
            text_arquivo = arquivo_url;
        } else if (video_boolean){
            text_arquivo = arquivo_url;
        } else{
            text_arquivo = message.text.body;
        }
        // console.log('text_arquivo',text_arquivo)
        
        const IA_response_bloqueio_perg = await ge.gemini_g(prompt_perg_bloqueio,text_arquivo,array_prompts_perg_bloqueio,caption);
        const IA_response_bloqueio_perg_json = JSON.parse(IA_response_bloqueio_perg);
        // console.log('IA_response_bloqueio_perg_json',IA_response_bloqueio_perg_json);
        
        //transformar responda da IA em json
        //verificar se o bloqueio para perguntas nao relacionadas é true
        if (IA_response_bloqueio_perg_json.bloqueio === true){
            //AVISOS
            const aviso_cliente = history_cliente && history_cliente.avisos? history_cliente.avisos : 0;
            //se o cliente nao existe ainda : 
            if(aviso_cliente==0){
                const msg = 'Você está fazendo perguntas que não são relacionadas com a Nome_da_empresa. Por favor, foque em perguntas sobre os nossos produtos.'
                await resposta_cliente(msg,business_phone_number_id,message);
                history_cliente.avisos = aviso_cliente + 1
                await salvar_servidor(transaction,docref_id_phone_history,history_cliente,'text',msg,'model')
            } else if (aviso_cliente == 1) {
                const msg = 'Você está fazendo perguntas que não são relacionadas com a Nome_da_empresa, seus produtos ou usos específicos dos produtos. Esta é a PRIMEIRA advertência. Na SEGUNDA, você será BLOQUEADO . Não concorda com esta advertência? Chame o "suporte" e nos avise sobre o erro, para que possamos melhorar. Boa conversa'
                await resposta_cliente(msg,business_phone_number_id,message);
                history_cliente.avisos = aviso_cliente + 1
                await salvar_servidor(transaction,docref_id_phone_history,history_cliente,'text',msg,'model')
                
            } else if (aviso_cliente >= 2 ){
                history_cliente.avisos = 0
                history_cliente.bloqueio_ia = true
                //retirar do history_bloqueio deixa um [] vazio
                history_cliente.history_bloqueio = [];
                //data do bloqueio
                history_cliente.date = Date.now().toString()
                const msg = 'Você está fazendo perguntas que não são relacionadas à Nome_da_empresa, seus produtos ou usos específicos dos produtos. Você foi BLOQUEADO . Não concorda com esta advertência? Como você foi bloqueado, todas as mensagens irão diretamente para um ser humano, então você pode fazer sua reclamação a partir de agora.\n Lembre-se, não atendemos aos sábados e domingos. Tenha um bom dia.'
                await resposta_cliente(msg,business_phone_number_id,message);
                sendEmail('Cliente bloqueado por PERGUNTAS NÃO RELACIONADAS',`O cliente ${nome_cliente} com o número ${phone_number} foi bloqueado .`);
                await salvar_servidor(transaction,docref_id_phone_history,history_cliente,'text',msg,'model')
            }
            transaction.update(docref_id_phone_history, { history_cliente });
        } else {
            // IA:
            //////////////////////// transcricao de audio, imagem, video ///////////////////////////////////////
            let transcricao_texto;
            if(audio_boolean ){
                console.log('arquivo_url',arquivo_url)
                let IA_response_transcricao;
                let attempts = 0;
                const maxAttempts = 3;
                
                while (attempts < maxAttempts) {
                  try {
                    IA_response_transcricao = await ge.gemini_transcricao(arquivo_url,true);
                    if (IA_response_transcricao !== undefined) {
                      break; // Se a resposta não for undefined, sai do loop
                    }
                  } catch (error) {
                    console.error('Erro ao processar o arquivo:', error);
                  }
                  attempts++;
                  console.log(`Tentativa ${attempts} de transcrição do áudio...`);
                  await new Promise(resolve => setTimeout(resolve, 1500)); // Aguarda 1,5 segundos antes de tentar novamente
                }
                
                if (IA_response_transcricao === undefined) {
                  console.error('Falha na transcrição do áudio após 3 tentativas.');
                  // Aqui você pode adicionar um tratamento de erro, como enviar uma mensagem ao usuário informando que a transcrição falhou.
                } else {
                  transcricao_texto = `transcrição audio: ${IA_response_transcricao}`;
                  // console.log('IA_response_transcricao',IA_response_transcricao);
                }
                
            } else if (image_boolean){
                console.log('arquivo_url',arquivo_url)
                let IA_response_transcricao;
                let attempts = 0;
                const maxAttempts = 3;
                
                while (attempts < maxAttempts) {
                  try {
                    IA_response_transcricao = await ge.gemini_transcricao(arquivo_url,false,true);
                    if (IA_response_transcricao !== undefined) {
                      break; // Se a resposta não for undefined, sai do loop
                    }
                  } catch (error) {
                    console.error('Erro ao processar o arquivo:', error);
                  }
                  attempts++;
                  console.log(`Tentativa ${attempts} de transcrição do image...`);
                  await new Promise(resolve => setTimeout(resolve, 1500)); // Aguarda 1,5 segundos antes de tentar novamente
                }
                
                if (IA_response_transcricao === undefined) {
                  console.error('Falha na transcrição do image após 3 tentativas.');
                  // Aqui você pode adicionar um tratamento de erro, como enviar uma mensagem ao usuário informando que a transcrição falhou.
                } else {
                  transcricao_texto = `transcrição imagem: ${IA_response_transcricao} + Legenda da imagem: ${caption}`;
                  // console.log('IA_response_transcricao',IA_response_transcricao);
                }
            } else if (video_boolean){
                console.log('arquivo_url',arquivo_url)
                let IA_response_transcricao;
                let attempts = 0;
                const maxAttempts = 3;
                
                while (attempts < maxAttempts) {
                  try {
                    IA_response_transcricao = await ge.gemini_transcricao(arquivo_url,false,false,true);
                    if (IA_response_transcricao !== undefined) {
                      break; // Se a resposta não for undefined, sai do loop
                    }
                  } catch (error) {
                    console.error('Erro ao processar o arquivo:', error);
                  }
                  attempts++;
                  console.log(`Tentativa ${attempts} de transcrição do video...`);
                  await new Promise(resolve => setTimeout(resolve, 1500)); // Aguarda 1,5 segundos antes de tentar novamente
                }
                
                if (IA_response_transcricao === undefined) {
                  console.error('Falha na transcrição do video após 3 tentativas.');
                  // Aqui você pode adicionar um tratamento de erro, como enviar uma mensagem ao usuário informando que a transcrição falhou.
                } else {
                  transcricao_texto = `transcrição do video: ${IA_response_transcricao} + Legenda do video: ${caption}`;
                  // console.log('IA_response_transcricao',IA_response_transcricao);
                }
            } else {
                transcricao_texto = message.text.body;
            }
            
            /////////////////////////////EMBEDDINGS/////////////////////////////////////////////////
            // EMBEDDINGS CONSULTA : 
            // PROMPT:
            const prompts_docs = data_prompts_genereteds && data_prompts_genereteds.prompt_doc ? data_prompts_genereteds.prompt_doc : [];
            const prompts_perg = data_prompts_genereteds && data_prompts_genereteds.prompt_perg ? data_prompts_genereteds.prompt_perg : [];
            // console.log('prompts_docs',prompts_docs);
            // console.log('prompts_perg',prompts_perg);
            const prompt_whats = prompts.prompt_w(prompts_docs,prompts_perg,nome_cliente);
            console.log('prompt_whats',prompt_whats )
            
            ///////////////////////////MUDAR PARA ACEITAR ENTRADA DE AUDIO AO RESPONDER ///////////////////////////////
            //IA ja altera o history_cliente atualizando as info
            const ia_name = data_prompts_genereteds && data_prompts_genereteds.ia? data_prompts_genereteds.ia : 'models/gemini-1.5-flash'
            const temperatura = data_prompts_genereteds && data_prompts_genereteds.temperatura? data_prompts_genereteds.temperatura : 0.7
            let IA_response
            if(audio_boolean){
                const IA_response_ = await ge.gemini(ia_name,temperatura,prompt_whats, text_arquivo, history_cliente?.history || [], true);
                resposta_cliente(IA_response_,business_phone_number_id,message);
                IA_response = IA_response_;
            }else if (video_boolean){
                const IA_response_ = await ge.gemini(ia_name,temperatura,prompt_whats, text_arquivo, history_cliente?.history || [], false, false, true,caption);
                resposta_cliente(IA_response_,business_phone_number_id,message);
                IA_response = IA_response_;
            }else if (image_boolean){
                const IA_response_ = await ge.gemini(ia_name,temperatura,prompt_whats, text_arquivo, history_cliente?.history || [], false, true, false,caption);
                resposta_cliente(IA_response_,business_phone_number_id,message);
                IA_response = IA_response_;
            }else {
                const IA_response_ = await ge.gemini(ia_name,temperatura,prompt_whats, text_arquivo, history_cliente?.history || []);
                resposta_cliente(IA_response_,business_phone_number_id,message);
                IA_response = IA_response_;
            }
            
           
            //adiciona no history_bloqueio 
            // console.log('rafaaki')
            // console.log(history_cliente)
            // console.log(history_cliente?.history_bloqueio)
            history_cliente?.history_bloqueio.push({ role: "user", parts: [{text: transcricao_texto || ''}] }, { role: "model", parts:[{text: IA_response || ''}]})
            if (audio_boolean || image_boolean || video_boolean) {
                //retirar os ultimos adicionados
                history_cliente.history.pop(); 
                history_cliente.history.pop(); 
                history_cliente.history.pop(); 
                history_cliente.history.push({ role: "user", parts: [{text: transcricao_texto || ''}] }, { role: "model", parts:[{text: IA_response || ''}]})
            }

            if(history_cliente?.history_bloqueio && history_cliente?.history_bloqueio.length > 4){
                history_cliente.history_bloqueio.shift();
                history_cliente.history_bloqueio.shift();
            }
            // Se o histórico do cliente existir, adiciona a nova mensagem
            // Verifica se o histórico do cliente já tem mais de 15 mensagens
            if (history_cliente?.history?.length >= 14) {
                // Remove as duas primeiras mensagem (as mais antigas)
                history_cliente.history.shift(); 
                history_cliente.history.shift();
            }
            //Salvar mensagem BD
            await salvar_servidor(transaction,docref_id_phone_history,history_cliente,'text',IA_response,'model');
            // Buscando bloqueio de suporte:
            const array_prompts_suport_bloqueio = data_prompts_genereteds && data_prompts_genereteds.bloqueio_support ? data_prompts_genereteds.bloqueio_support : [];
            // console.log('array_prompts_suport_bloqueio',array_prompts_suport_bloqueio);
            const prompt_suport_bloqueio = prompts.prompt_support()

            const history_json = JSON.stringify(history_cliente?.history_bloqueio,null,0);
            // console.log('history_json_',history_json);

            
            const IA_response_bloqueio_suport = await ge.gemini_g(prompt_suport_bloqueio, history_json, array_prompts_suport_bloqueio);
            let IA_response_bloqueio_suport_json = JSON.parse(IA_response_bloqueio_suport);

            let bloqueioConfirmado = false;
            let attempts = 0;
            const maxAttempts = 2; // Número de tentativas para confirmar o bloqueio
            while (attempts < maxAttempts && !bloqueioConfirmado) {
                if (IA_response_bloqueio_suport_json?.bloqueio === true) {
                     // Se a resposta for true, tenta novamente
                     const IA_response_bloqueio_suport_retry = await ge.gemini_g(prompt_suport_bloqueio, history_json, array_prompts_suport_bloqueio);
                     IA_response_bloqueio_suport_json = JSON.parse(IA_response_bloqueio_suport_retry);
                     console.log(`IA_response_bloqueio_suport_json_ tentativa : ${attempts} :=> `,IA_response_bloqueio_suport_json);
                     attempts++;
                } else {
                    bloqueioConfirmado = true;
                }
            }
            
            if (IA_response_bloqueio_suport_json?.bloqueio === true){
                
                const now = moment.tz('America/Sao_Paulo');
                const dayOfWeek = now.day(); // 0 (Domingo) - 6 (Sábado)
                const currentHour = now.hour(); // 0 - 23
                // Nosso horário de atendimento é de segunda a sexta das 8:30 às 12:00 e das 13:30 às 17:30.
                // console.log('dayOfWeek', dayOfWeek);
                // console.log('currentHour', currentHour);
                                

                if (dayOfWeek === 0 || dayOfWeek === 6 || (currentHour >= 18 && currentHour <= 23) || (currentHour >= 0 && currentHour <= 8.5)) {
                    // Se for sábado, domingo, ou horário fora do expediente comercial
                    if (history_cliente) {
                        history_cliente.history_bloqueio = [];
                        const msg = "No momento, o suporte humano está indisponível, o horário de atendimento é de segunda a sexta, das 8h às 12h e das 13h30 às 17h30.\n\nPorém notificamos o nosso suporte humano sobre sua solicitação.\n\nEntão não te bloqueamos, poderá continuar conversando com nossa IA."
                        await axios({
                            method: 'POST',
                            url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
                            headers: {
                                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                            },
                            data: {
                                messaging_product: 'whatsapp',
                                to: message.from,
                                text: { body: msg},
                            },
                        });

                        await salvar_servidor(transaction,docref_id_phone_history,history_cliente,'text',msg,'model');
                        sendEmail('Cliente pede ajuda do SUPORTE (Fora do Expediente)',`O cliente ${nome_cliente} com o número ${phone_number} tentou acessar o suporte fora do expediente.`);
                    }
                } else if (currentHour >= 12 && currentHour < 13.5) {
                    // Se for horário de almoço
                    history_cliente.history_bloqueio = [];
                    const msg = "Estamos em horário de almoço, das 12h às 13h30.\n\nPorém notificamos o nosso suporte humano sobre sua solicitação.\n\nEntão não te bloqueamos, poderá continuar conversando com nossa IA. Logo um antendente, estará disponível para te atender." 
                    if (history_cliente) {
                        await axios({
                            method: 'POST',
                            url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
                            headers: {
                                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                            },
                            data: {
                                messaging_product: 'whatsapp',
                                to: message.from,
                                text: { body: msg},
                            },
                        });

                        await salvar_servidor(transaction,docref_id_phone_history,history_cliente,'text',msg,'model');
                        sendEmail('Cliente pede ajuda do SUPORTE (ALMOÇO)',`O cliente ${nome_cliente} com o número ${phone_number} tentou acessar o suporte fora do expediente no horário de ALMOÇO. `);
                    }
                } else {
                    // Se for dentro do expediente comercial
                    if (history_cliente) {
                        history_cliente.avisos = 0;
                        history_cliente.bloqueio_ia = true; // Bloqueia a IA nesse caso
                        //retirar do history_bloqueio deixa um [] vazio
                        history_cliente.history_bloqueio = [];
                        const msg = "Suporte acionado. A partir de agora, você está conversando com um humano do nosso time de suporte."
                        await axios({
                            method: 'POST',
                            url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
                            headers: {
                                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                            },
                            data: {
                                messaging_product: 'whatsapp',
                                to: message.from,
                                text: { body: msg },
                            },
                        });
                        await salvar_servidor(transaction,docref_id_phone_history,history_cliente,'text',msg,'model');
                        sendEmail('Cliente bloqueado pelo SUPORTE',`O cliente ${nome_cliente} com o número ${phone_number} foi bloqueado.`);
                    }
                }
               
            }
            
            
            //Salvar no banco
            transaction.update(docref_id_phone_history, { history_cliente });
        }
    }
    async function sendEmail(assunto,textoemail) {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // seu email
                pass: process.env.EMAIL_PASSWORD // sua senha
            }
        });

        let info = await transporter.sendMail({
            from: '"IA WHATSAPP" <process.env.EMAIL_USER>', // remetente
            to: "destinatário@xx.com", // destinatário
            subject: assunto, // Assunto
            text: textoemail, // corpo do email
        });

        console.log("Email enviado: %s", info.messageId);
    }
    //Funcao salvar mensagem Servidor Async
    const uploadToBucket = async (filePath, destination) => {
        const bucket = storage.bucket(bucketName);
        // Crie um arquivo temporário para o upload
        try {
            const [file] = await bucket.upload(filePath, {
                uploadType: 'media',
                destination: destination,
            });
    
            // Tornar o arquivo público
            await file.makePublic();
    
            // Construir a URL pública
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
            return publicUrl;
        } catch (err) {
            console.error('Erro ao fazer upload:', err);
            throw err;
        }
    };
    
    const func_salvar_servidor_arquvios = async (transaction,content, mimeType, type, sender, docref_id_phone_history, history_cliente, phone, id_message) => {
        const response_arquivo = await axios({
            method: 'GET',
            url: content,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            responseType: 'arraybuffer'
        });
        const dataToWrite  = response_arquivo.data;

        const id = uuid();
        let destination
        let tipo_de_arquivo
        if (mimeType.includes('audio')) {
            tipo_de_arquivo = mimeType.replace('audio/', '');
            destination = `${type}/${phone}/${id}.${tipo_de_arquivo}`;
        } else if (mimeType.includes('image')) {
            tipo_de_arquivo = mimeType.replace('image/', '');
            destination = `${type}/${phone}/${id}.${tipo_de_arquivo}`;
        } else if (mimeType.includes('video')) {
            tipo_de_arquivo = mimeType.replace('video/', '');
            destination = `${type}/${phone}/${id}.${tipo_de_arquivo}`;
        } else if (mimeType.includes('document')) {
            tipo_de_arquivo = mimeType.replace('document/', '');
            destination = `${type}/${phone}/${id}.${tipo_de_arquivo}`;
        }
        // Modificado para aceitar buffer
        console.log('destination',destination);
        const tempFilePath = path.join("/tmp", `arquivoToSave.${tipo_de_arquivo}`); 
        fs.writeFileSync(tempFilePath, dataToWrite);
        const url = await uploadToBucket(tempFilePath, destination);
        // Remova o arquivo temporário
        fs.unlinkSync(tempFilePath);
        history_cliente.whatsapp_messages.push({
            view : false,
            date: Date.now(),
            messageType: type,
            sender: sender,
            content: url,
            id :id_message || ''
        });
        if (history_cliente && (!history_cliente.bloqueio_ia && !history_cliente.bloqueio_user  && sender==='user' && type !== 'document')){
            history_cliente.whatsapp_messages.push({
                view : false,
                date: Date.now(),
                messageType: 'text',
                sender: 'model',
                content: 'Aguarde...'
            });
        }
        // Atualiza o documento no Firestore com a transação
        transaction.update(docref_id_phone_history, { history_cliente });
    } 
    const salvar_servidor = async (transaction,docref_id_phone_history,history_cliente,type,content,sender, mimetype, phone_number, id_message) => {
        if(type === 'text') {
            if(id_message){
                history_cliente.whatsapp_messages.push({
                    view : false,
                    date: Date.now(),
                    messageType: type,
                    sender: sender,
                    content: content,
                    id : id_message
                });
            }else {
                history_cliente.whatsapp_messages.push({
                    view : false,
                    date: Date.now(),
                    messageType: type,
                    sender: sender,
                    content: content,
                });
            }
            if (history_cliente && (!history_cliente.bloqueio_ia && !history_cliente.bloqueio_user) && sender==='user'){
                history_cliente.whatsapp_messages.push({
                    view : false,
                    date: Date.now(),
                    messageType: 'text',
                    sender: 'model',
                    content: 'Aguarde...'
                });
            }
            // Atualiza o documento no Firestore com a transação
            transaction.update(docref_id_phone_history, { history_cliente });
        }else if (type === 'audio' || type === 'image' || type === 'video' || type === 'document') {
            await func_salvar_servidor_arquvios( transaction,content, mimetype, type, sender, docref_id_phone_history, history_cliente, phone_number, id_message)
        }
    }
    if (req.method === 'POST') {
        // Log das mensagens recebidas
        console.log('Incoming webhook message:', JSON.stringify(req.body, null, 2));
        const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        const nome_cliente = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name;
        const read = req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.status;

        if (message?.type === 'text') {
            const business_phone_number_id = req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
            const phone_number = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id;
        
            const docref_id_phone_history = admin.firestore().collection('history_w_ia').doc(phone_number);
        
            await admin.firestore().runTransaction(async (transaction) => {
                const getdoc_phone_history = await transaction.get(docref_id_phone_history);
                const data_phone_history = getdoc_phone_history.data();

                const user_block_message = data_phone_history && data_phone_history.user_block_message ? data_phone_history.user_block_message : false;
                console.log('user_block_message',user_block_message);

                if(user_block_message)return

                let history_cliente = data_phone_history && data_phone_history.history_cliente
                    ? data_phone_history.history_cliente
                    : { phone: phone_number, avisos: 0, name: nome_cliente, bloqueio_ia: false, bloqueio_user: false, history_bloqueio: [], history: [], whatsapp_messages: [], user_avatar: "" };

                // console.log(history_cliente);

                if (!data_phone_history) {
                    res.sendStatus(200);
                    console.log('apenas testando')
                    
                    await axios({
                        method: 'POST',
                        url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
                        headers: {
                            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                        },
                        data: {
                            messaging_product: 'whatsapp',
                            to: message.from,
                            text: { body: msg },
                            context: {
                                message_id: message.id,
                            },
                        },
                    });
        
                    history_cliente.whatsapp_messages.push({
                        view: false,
                        date: Date.now(),
                        messageType: 'text',
                        sender: 'user',
                        content: message.text.body,
                    });
                    history_cliente.whatsapp_messages.push({
                        view: false,
                        date: Date.now(),
                        messageType: 'text',
                        sender: 'model',
                        content: msg,
                    });
        
                    transaction.set(docref_id_phone_history, { history_cliente });
                    return;
                }
        
                salvar_servidor(transaction,docref_id_phone_history, history_cliente, 'text', message.text.body, 'user', null, null, message.id);
                await funcao_inicial_bloq(message, history_cliente, business_phone_number_id, docref_id_phone_history);
                
                if (!servidorAtivo) {
                    return;
                }
        
                await funcao_principal(transaction,message, docref_id_phone_history, history_cliente, business_phone_number_id);
            }).then(() => {
                console.log('Transação concluída com sucesso.');
            }).catch((error) => {
                console.error('Erro na transação:', error);
                res.status(500).send('Erro no processamento');
            });
        }else if (message?.type === 'audio'){
            const business_phone_number_id = req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
            const phone_number = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id;
            const docref_id_phone_history = await admin.firestore().collection('history_w_ia').doc(phone_number);
          
            await admin.firestore().runTransaction(async (transaction) => {
                const getdoc_phone_history = await transaction.get(docref_id_phone_history);
                const data_phone_history = getdoc_phone_history.data();

                const user_block_message = data_phone_history && data_phone_history.user_block_message ? data_phone_history.user_block_message : false;
                console.log('user_block_message',user_block_message);

                if(user_block_message)return

                let history_cliente = data_phone_history && data_phone_history.history_cliente
                    ? data_phone_history.history_cliente
                    : { phone: phone_number, avisos: 0, name: nome_cliente, bloqueio_ia: false, bloqueio_user: false, history_bloqueio: [], history: [], whatsapp_messages: [], user_avatar: "" };
        
                if (!data_phone_history) {
                    res.sendStatus(200);
                    await axios({
                        method: 'POST',
                        url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
                        headers: {
                            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                        },
                        data: {
                            messaging_product: 'whatsapp',
                            to: message.from,
                            text: { body: msg },
                            context: {
                                message_id: message.id,
                            },
                        },
                    });
        
                    history_cliente.whatsapp_messages.push({
                        view: false,
                        date: Date.now(),
                        messageType: 'text',
                        sender: 'user',
                        content: 'Mensagem de áudio enviada pelo cliente, mas como foi a primeira mensagem, o sistema não a processou corretamente. Por favor, peça para ele que envie novamente. (só você esta visualizando essa mensagem)'
                    });
                    history_cliente.whatsapp_messages.push({
                        view: false,
                        date: Date.now(),
                        messageType: 'text',
                        sender: 'model',
                        content: msg
                    });
        
                    transaction.set(docref_id_phone_history, { history_cliente});
                    return;
                }
        
                const audio_data = message.audio;
                const audio_id = audio_data.id;
                const audio_url = await axios({
                    method: 'GET',
                    url: `https://graph.facebook.com/v20.0/${audio_id}`,
                    headers: {
                        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                });
        
                const mime_type = audio_url.data.mime_type;
                const url = audio_url.data.url;
                await salvar_servidor(transaction, docref_id_phone_history, history_cliente, 'audio', url, 'user', mime_type, phone_number, message.id);
        
                await funcao_inicial_bloq(message, history_cliente, business_phone_number_id, docref_id_phone_history);
        
                if (!servidorAtivo) {
                    return;
                }
        
                const audio_gemini = await axios({
                    method: 'POST',
                    url: "https://URL_arquivos_gemini",
                    data: {
                        arquivo: url,
                        mime_type: mime_type,
                        phone: phone_number,
                    },
                });
        
                await funcao_principal(transaction,message, docref_id_phone_history, history_cliente, business_phone_number_id, audio_gemini.data, true);
            }).then(() => {
                console.log('Transação concluída com sucesso.');
            }).catch((error) => {
                console.error('Erro na transação:', error);
                res.status(500).send('Erro no processamento');
            });
        }else if (message?.type === 'image'){
            // res.sendStatus(200);
            //////////////////////////////////Acessando banco de dados//////////////////////////////////
            const business_phone_number_id = req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
            const phone_number = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id;
            ///
            //////////////////////////////// dados da image
            const image_data = message.image
            const image_id = image_data.id
            const caption = image_data.caption
            /////////CLIENTES:
            const docref_id_phone_history = await admin.firestore().collection('history_w_ia').doc(phone_number);
            await admin.firestore().runTransaction(async (transaction) => {
                const getdoc_phone_history = await transaction.get(docref_id_phone_history);
                const data_phone_history = getdoc_phone_history.data();
                // console.log('entrou aki bd : ', data_phone_history)
                const user_block_message = data_phone_history && data_phone_history.user_block_message ? data_phone_history.user_block_message : false;
                console.log('user_block_message',user_block_message);

                if(user_block_message)return

                let history_cliente = data_phone_history && data_phone_history.history_cliente? data_phone_history.history_cliente : { phone: phone_number, avisos: 0, name: nome_cliente ,bloqueio_ia: false,bloqueio_user: false, history_bloqueio:[], history: [],whatsapp_messages: [], user_avatar:"" };
                // console.log('history_cliente', history_cliente)
                if (!data_phone_history) {
                    res.sendStatus(200);
                    
                    await axios({
                        method: 'POST',
                        url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
                        headers: {
                        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                        },
                        data: {
                        messaging_product: 'whatsapp',
                        to: message.from,
                        text: { body:  msg},
                        context: {
                            message_id: message.id,
                        },
                        },
                    });
                    history_cliente.whatsapp_messages.push({
                        view : false,
                        date: Date.now(),
                        messageType: 'text',
                        sender: 'user',
                        content: 'Mensagem de imagem enviada pelo cliente, mas como foi a primeira mensagem, o sistema não a processou corretamente. Por favor, peça para ele que envie novamente. (só você esta visualizando essa mensagem)'
                    });
                    history_cliente.whatsapp_messages.push({
                        view : false,
                        date: Date.now(),
                        messageType: 'text',
                        sender: 'model',
                        content: msg
                    });
    
                    transaction.set(docref_id_phone_history, { history_cliente });
                    return;
                }
                // console.log('history_cliente:',JSON.stringify(history_cliente?.history, null, 0))
                // console.log('image_data',image_data);
                // console.log('image_id',image_id);
                /////////////////////////PROCESSAMENTO DA IMAGE////////////////////
                //GET usando o id para conseguir a url de baixar o image 
                const image_url = await axios({
                    method: 'GET',
                    url: `https://graph.facebook.com/v20.0/${image_id}`,
                    headers: {
                        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                });
                //
                // console.log('image_url',image_url);
                // console.log('image_url.data',image_url.data);
                const mime_type = image_url.data.mime_type
                const url = image_url.data.url
                //SALVAR
                await salvar_servidor(transaction,docref_id_phone_history,history_cliente,'image',url,'user', mime_type, phone_number, message.id)
                //BLOQUEIO
                await funcao_inicial_bloq(message, history_cliente, business_phone_number_id, docref_id_phone_history);
                if (!servidorAtivo) {
                    return;
                }
                // agora vamos enviar para nosso servidor no cloud o arquivo binario de image 
                const image_gemini = await axios({
                    method: 'POST',
                    url:"https://URL_arquivos_gemini",
                    data: {
                        arquivo: url,
                        mime_type: mime_type,
                        phone: phone_number,
                    }
                })
                console.log('image_gemini',image_gemini.data);
                await funcao_principal(transaction,message, docref_id_phone_history, history_cliente, business_phone_number_id, image_gemini.data,null,true,null,caption);
            }).then(() => {
                console.log('Transação concluída com sucesso.');
            }).catch((error) => {
                console.error('Erro na transação:', error);
                res.status(500).send('Erro no processamento');
            });
           
        }else if(message?.type === 'video') {
            console.log('Incoming webhook message:', JSON.stringify(req.body, null, 2));

            // res.sendStatus(200);
            //////////////////////////////////Acessando banco de dados//////////////////////////////////
            const business_phone_number_id = req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
            const phone_number = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id;
            ///
            //////////////////////////////// dados da video
            const video_data = message.video
            const video_id = video_data.id
            const caption = video_data.caption
            /////////CLIENTES:
            const docref_id_phone_history = await admin.firestore().collection('history_w_ia').doc(phone_number);
            await admin.firestore().runTransaction(async (transaction) => {
                const getdoc_phone_history = await transaction.get(docref_id_phone_history);
                const data_phone_history = getdoc_phone_history.data();
                
                const user_block_message = data_phone_history && data_phone_history.user_block_message ? data_phone_history.user_block_message : false;
                console.log('user_block_message',user_block_message);

                if(user_block_message)return

                let history_cliente = data_phone_history && data_phone_history.history_cliente? data_phone_history.history_cliente : { phone: phone_number, avisos: 0, name: nome_cliente ,bloqueio_ia: false,bloqueio_user: false, history_bloqueio:[], history: [],whatsapp_messages: [], user_avatar:"" };
                if (!data_phone_history) {
                    res.sendStatus(200);
                    
                    await axios({
                        method: 'POST',
                        url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
                        headers: {
                        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                        },
                        data: {
                        messaging_product: 'whatsapp',
                        to: message.from,
                        text: { body:  msg},
                        context: {
                            message_id: message.id,
                        },
                        },
                    });
                    history_cliente.whatsapp_messages.push({
                        view : false,
                        date: Date.now(),
                        messageType: 'text',
                        sender: 'user',
                        content: 'Mensagem de video enviada pelo cliente, mas como foi a primeira mensagem, o sistema não a processou corretamente. Por favor, peça para ele que envie novamente. (só você esta visualizando essa mensagem)'
                    });
                    history_cliente.whatsapp_messages.push({
                        view : false,
                        date: Date.now(),
                        messageType: 'text',
                        sender: 'model',
                        content: msg
                    });

                    transaction.set(docref_id_phone_history, { history_cliente });
                    return;
                }
                // console.log('history_cliente:',JSON.stringify(history_cliente?.history, null, 0))
                // console.log('video_data',video_data);
                // console.log('video_id',video_id);
                /////////////////////////////////PROCESSAMENTO DO VIDEO ///////////////////////////////////
                //GET usando o id para conseguir a url de baixar o video 
                const video_url = await axios({
                    method: 'GET',
                    url: `https://graph.facebook.com/v20.0/${video_id}`,
                    headers: {
                        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                });
                // console.log('video_url',video_url);
                // console.log('video_url.data',video_url.data);
                const mime_type = video_url.data.mime_type
                const url = video_url.data.url
                //SALVAR
                await salvar_servidor(transaction,docref_id_phone_history,history_cliente,'video',url,'user', mime_type, phone_number, message.id)
                //BLOQUEIO
                await funcao_inicial_bloq(message, history_cliente, business_phone_number_id,docref_id_phone_history);
                if (!servidorAtivo) {
                    return;
                }
                const video_gemini = await axios({
                    method: 'POST',
                    url:"https://URL_arquivos_gemini",
                    data: {
                        arquivo: url,
                        mime_type: mime_type,
                        phone: phone_number,
                        video: true,
                    },
                })
                console.log('video_gemini',video_gemini.data);
               
                await funcao_principal(transaction,message, docref_id_phone_history, history_cliente, business_phone_number_id, video_gemini.data,null,null,true,caption);
            }).then(() => {
                console.log('Transação concluída com sucesso.');
            }).catch((error) => {
                console.error('Erro na transação:', error);
                res.status(500).send('Erro no processamento');
            });
            
        }else if (message?.type === 'document'){
            //////////////////////////////////Acessando banco de dados//////////////////////////////////
            const business_phone_number_id = req.body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
            const phone_number = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id;
            ///
            //////////////////////////////// dados da document
            const document_data = message.document
            const document_id = document_data.id
            const caption = document_data.caption
            /////////CLIENTES:
            const docref_id_phone_history = await admin.firestore().collection('history_w_ia').doc(phone_number);
            await admin.firestore().runTransaction(async (transaction) => {
                const getdoc_phone_history = await transaction.get(docref_id_phone_history);
                const data_phone_history = getdoc_phone_history.data();

                const user_block_message = data_phone_history && data_phone_history.user_block_message ? data_phone_history.user_block_message : false;
                console.log('user_block_message',user_block_message);

                if(user_block_message)return

                const history_cliente = data_phone_history && data_phone_history.history_cliente? data_phone_history.history_cliente : { phone: phone_number, avisos: 0, name: nome_cliente ,bloqueio_ia: false,bloqueio_user: false, history_bloqueio:[], history: [],whatsapp_messages: [], user_avatar:"" };

                if (!data_phone_history) {
                    res.sendStatus(200);
                    await axios({
                        method: 'POST',
                        url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
                        headers: {
                        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                        },
                        data: {
                        messaging_product: 'whatsapp',
                        to: message.from,
                        text: { body:  msg},
                        context: {
                            message_id: message.id,
                        },
                        },
                    });
                    history_cliente.whatsapp_messages.push({
                        view : false,
                        date: Date.now(),
                        messageType: 'text',
                        sender: 'user',
                        content: 'Mensagem de documento enviada pelo cliente, mas como foi a primeira mensagem, o sistema não a processou corretamente. Por favor, peça para ele que envie novamente. (só você esta visualizando essa mensagem)'
                    });
                    history_cliente.whatsapp_messages.push({
                        view : false,
                        date: Date.now(),
                        messageType: 'text',
                        sender: 'model',
                        content: msg
                    });
    
                    transaction.set(docref_id_phone_history, { history_cliente });
                    return;
                }
                /////////////////////////////////PROCESSAMENTO DO document ///////////////////////////////////
                //GET usando o id para conseguir a url de baixar o document 
                const document_url = await axios({
                    method: 'GET',
                    url: `https://graph.facebook.com/v20.0/${document_id}`,
                    headers: {
                        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                });
                // console.log('document_url',document_url);
                // console.log('document_url.data',document_url.data);
                let mime_type = document_url.data.mime_type
                if (mime_type === 'application/msword' || mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    mime_type = mime_type === 'application/msword' ? "document/doc" : "document/docx";
                } else if (mime_type === 'application/pdf') {
                    mime_type = "document/pdf";
                }
                const url = document_url.data.url
                //SALVAR
                await salvar_servidor(transaction,docref_id_phone_history,history_cliente,'document',url,'user', mime_type, phone_number, message.id)
                
            }).then(() => {
                console.log('Transação concluída com sucesso.');
            }).catch((error) => {
                console.error('Erro na transação:', error);
                res.status(500).send('Erro no processamento');
            });
           
        }else if (read === 'read'){
            //salvar banco de dados como waid_view
            const phone_number = req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.recipient_id;
            const waid = req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.id;
            const timestamp = req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.timestamp;

            console.log('phone_number', phone_number)
            console.log('waid', waid)
            console.log('timestamp', timestamp)

            const docref_id_phone_history = await admin.firestore().collection('history_w_ia').doc(phone_number);
            const get_doc_time_view = await docref_id_phone_history.get();
            const data_time_view = get_doc_time_view.data();
            // console.log('data_time_view', data_time_view)
            //verificar se o waid_view ja existe
            if(data_time_view && data_time_view.waid_view){
                console.log('data_time_view.waid_view',data_time_view.waid_view)

                if(timestamp === data_time_view.waid_view.timestamp){
                    const array_waid = [...data_time_view.waid_view.waid]
                    array_waid.push(waid)
                    console.log('array_waid',array_waid)
                    const waid_view = {
                        waid: array_waid,
                        timestamp:timestamp
                    }
                    await docref_id_phone_history.update({ waid_view: waid_view });

                }else {
                    const waid_view = {
                        waid: [waid],
                        timestamp:timestamp
                    }
                    console.log('waid_view',waid_view)
                    await docref_id_phone_history.update({ waid_view: waid_view });
                }

            }else {
                 //upadate
                const waid_view = {
                    waid: [waid],
                    timestamp:timestamp
                }
                console.log('waid_view',waid_view)
                await docref_id_phone_history.update({ waid_view: waid_view });
            }
           
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(405); // Método não permitido
    }
});


