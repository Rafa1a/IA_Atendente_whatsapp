const functions = require('@google-cloud/functions-framework');
const { CloudTasksClient } = require('@google-cloud/tasks');
const tasksClient = new CloudTasksClient();
const admin = require('firebase-admin');
admin.initializeApp();

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// Função HTTP para lidar com o webhook
functions.http('whatsappWebhook', async (req, res) => {
    ///////////////////////FUNÇÕES/////////////////////////////////////////////////////////////////////////////////////
    
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // Verificação do webhook
        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
        console.log('Webhook verified successfully!');
        } else {
        res.sendStatus(403);
        }
    } else if (req.method === 'POST') {
        // Log das mensagens recebidas
        console.log('Incoming webhook message:', JSON.stringify(req.body, null, 2));
        const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        const read = req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.status;

        if ( message?.type === 'text' || message?.type === 'audio' || message?.type === 'image' || message?.type === 'video' || message?.type === 'document'){
            const phone_number = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id;

            if (phone_number) {
                const project = 'Project_ID';
                const location = 'us-central1';
                const queueName = `whatsapp-${phone_number}`;
                const queuePath = tasksClient.queuePath(project, location, queueName);

                try {
                    // Verificar se a fila já existe
                    await tasksClient.getQueue({ name: queuePath });
                    console.log(`Fila ${queueName} já existe.`);
                } catch (error) {
                    if (error.code === 5) { // Code 5 significa NOT_FOUND
                        // Fila não existe, então criar uma nova
                        const queue = {
                            name: queuePath,
                            rateLimits: {
                                maxDispatchesPerSecond: 10,
                                maxConcurrentDispatches: 1,
                            },
                            retryConfig: {
                                maxAttempts: 50, // Número máximo de tentativas por tarefa
                                maxRetryDuration: { seconds: 600 }, // Duração máxima da nova tentativa (600 segundos = 10 minutos)
                                minBackoff: { seconds: 0, nanos: 100000000 }, // Espera mínima entre tentativas (0.1 segundos)
                                maxBackoff: { seconds: 3600 }, // Espera máxima entre tentativas (3600 segundos = 1 hora)
                                maxDoublings: 16, // Número máximo de duplicações
                            },
                        };
                        await tasksClient.createQueue({
                            parent: tasksClient.locationPath(project, location),
                            queue: queue,
                        });
                        console.log(`Fila ${queueName} criada.`);
                    } else {
                        console.error('Erro ao verificar ou criar a fila:', error);
                        throw error; // Propague o erro para que ele possa ser tratado em outro lugar
                    }
                }

                // Agora a task na fila específica para o número de celular
                const url = 'https://us-central1-Project_ID.cloudfunctions.net/IA_whatszapp_Response';
                const serviceAccountEmail = 'Email_Service_Accound_Que_possua_Permissões';

                const payload = JSON.stringify(req.body);

                const task = {
                    httpRequest: {
                        httpMethod: 'POST',
                        url,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: Buffer.from(payload).toString('base64'),
                        oidcToken: {
                            serviceAccountEmail,
                        },
                    },
                };

                // Criando a task na fila específica para o cliente
                const [response] = await tasksClient.createTask({
                    parent: queuePath,
                    task,
                });
                console.log(`Task ${response.name} criada `);
            }
        }else if (read === 'read'){
            const phone_number = req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.recipient_id;
            
            if (phone_number) {
                const project = 'Project_ID';
                const location = 'us-central1';
                const queueName = `whatsapp-${phone_number}`;
                const queuePath = tasksClient.queuePath(project, location, queueName);

                try {
                    // Verificar se a fila já existe
                    await tasksClient.getQueue({ name: queuePath });
                    console.log(`Fila ${queueName} já existe.`);
                } catch (error) {
                    if (error.code === 5) { // Code 5 significa NOT_FOUND
                        // Fila não existe, então criar uma nova
                        const queue = {
                            name: queuePath,
                            rateLimits: {
                                maxDispatchesPerSecond: 10,
                                maxConcurrentDispatches: 1,
                            },
                            retryConfig: {
                                maxAttempts: 50, // Número máximo de tentativas por tarefa
                                maxRetryDuration: { seconds: 600 }, // Duração máxima da nova tentativa (600 segundos = 10 minutos)
                                minBackoff: { seconds: 0, nanos: 100000000 }, // Espera mínima entre tentativas (0.1 segundos)
                                maxBackoff: { seconds: 3600 }, // Espera máxima entre tentativas (3600 segundos = 1 hora)
                                maxDoublings: 16, // Número máximo de duplicações
                            },
                        };
                        await tasksClient.createQueue({
                            parent: tasksClient.locationPath(project, location),
                            queue: queue,
                        });
                        console.log(`Fila ${queueName} criada.`);
                    } else {
                        console.error('Erro ao verificar ou criar a fila:', error);
                        throw error; // Propague o erro para que ele possa ser tratado em outro lugar
                    }
                }

                // Agora a task na fila específica para o número de celular
                const url = 'https://us-central1-Project_ID.cloudfunctions.net/IA_whatszapp_Response';
                const serviceAccountEmail = 'Email_Service_Accound_Que_possua_Permissões';

                const payload = JSON.stringify(req.body);

                const task = {
                    httpRequest: {
                        httpMethod: 'POST',
                        url,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: Buffer.from(payload).toString('base64'),
                        oidcToken: {
                            serviceAccountEmail,
                        },
                    },
                };

                // Criando a task na fila específica para o cliente
                const [response] = await tasksClient.createTask({
                    parent: queuePath,
                    task,
                });
                console.log(`Task ${response.name} criada `);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(405); // Método não permitido
    }
});
