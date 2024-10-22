const functions = require('@google-cloud/functions-framework');
const { GoogleAIFileManager, FileState } = require("@google/generative-ai/files");
const fs = require('fs').promises;
const axios = require('axios');

functions.http('arquivoServer', async (req, res) => {
    const apiKey = process.env.GENERATIVE_AI_API_KEY;
    const fileManager = new GoogleAIFileManager(apiKey);
    const GRAPH_API_TOKEN = process.env.GRAPH_API_TOKEN;


    // Função para fazer o upload do arquivo para o Gemini
    async function uploadToGemini(filePath, mimeType) {
        console.log(`Iniciando upload do arquivo: ${filePath}`);
        const uploadResult = await fileManager.uploadFile(filePath, {
            mimeType,
            displayName: `${req.body.phone}`,
        });
        const file = uploadResult.file;
        console.log(`Arquivo carregado ${file.displayName} como: ${file.name}`);
        return file;
    }

    // Verifica se o arquivo foi enviado na requisição
    if (!req.body.arquivo) {
        console.log('Arquivo não encontrado na requisição.');
        console.log(req.body)
        return res.status(400).send('Arquivo de áudio não encontrado na requisição.');
    }
    
    // Verifica o tipo de arquivo (audio, imagem, vídeo)
    const tipo_de_arquivo = req.body.mime_type.split('/')[0]; 
    
    // Determina o nome e caminho do arquivo temporário
    let tempFilePath;
    if (tipo_de_arquivo === 'audio') {
        tempFilePath = `${req.body.phone}.${req.body.mime_type.replace('audio/', '')}`;
    }
    if (tipo_de_arquivo === 'image') {
        tempFilePath = `${req.body.phone}.${req.body.mime_type.replace('image/', '')}`;
    }
    if (tipo_de_arquivo === 'video') {
        tempFilePath = `${req.body.phone}.${req.body.mime_type.replace('video/', '')}`;
    }
    
    const url = req.body.arquivo;
    // GET na url para baixar o arquivo de video
    const response = await axios({
        method: 'GET',
        url: url,
        headers: {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        },
        responseType: 'arraybuffer'
    });
    const dataToWrite  = response.data;
    
    // Salva o arquivo de áudio em um arquivo temporário
    try {
        await fs.writeFile(tempFilePath, dataToWrite);
        console.log('Arquivo escrito com sucesso:', tempFilePath);

        // Faz o upload do arquivo para o Gemini
        const file_arquivo = await uploadToGemini(tempFilePath, req.body.mime_type);
        console.log('Arquivo carregado para o Gemini:', JSON.stringify(file_arquivo, null, 2));

        // Verifica o estado do arquivo no Gemini
        let file = await fileManager.getFile(file_arquivo.name);
        while (file.state === FileState.PROCESSING) {
            console.log('Aguardando processamento...');
            // Aguarde 2 segundos antes de verificar novamente
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Obtenha o arquivo do Gemini novamente
            file = await fileManager.getFile(file_arquivo.name);
        }

        // Verifica se o arquivo falhou ao processar
        if (file.state === FileState.FAILED) {
            console.log('Falha ao processar o arquivo.');
            return res.status(500).send("Falha no processamento do arquivo.");
        }

        // Envie a resposta com os dados do arquivo
        res.json({
            "mimeType": file_arquivo.mimeType,
            "uri": file_arquivo.uri
        });

        // Remove o arquivo temporário
        await fs.unlink(tempFilePath);
        console.log('Arquivo local temporário removido com sucesso:', tempFilePath);
    } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
        res.status(500).send('Erro ao processar o arquivo.');
    }
});
