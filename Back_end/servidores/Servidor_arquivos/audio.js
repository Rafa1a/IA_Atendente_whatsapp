const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors')({ origin: 'URL_FRONTEND' });
const fs = require('fs');
const path = require('path');
const uuid = require('uuid-v4');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

const storage = new Storage();
const bucketName = 'meu-bucket-exemplo';

// Configurar o ffmpeg para usar o binário estático
ffmpeg.setFfmpegPath(ffmpegPath);

functions.http('uploadFile', (req, res) => {
    cors(req, res, async () => {
        
        // Determinar tipo de arquivo, tempfilepath e buffer
        let tipo_de_arquivo;
        let FilePath;
        let Buffers;
        const id = uuid();

        if (req.body.mimeType.includes('audio')) {
            tipo_de_arquivo = req.body.mimeType.replace('audio/', '');
            FilePath = `audio/${req?.body?.phone || '00000000000'}/${id}.${tipo_de_arquivo}`;
            Buffers = Buffer.from(req.body.audio, 'base64');
        } else if (req.body.mimeType.includes('image')) {
            tipo_de_arquivo = req.body.mimeType.replace('image/', '');
            FilePath = `image/${req?.body?.phone || '00000000000'}/${id}.${tipo_de_arquivo}`;
            Buffers = Buffer.from(req.body.image, 'base64');
        } else if (req.body.mimeType.includes('video')) {
            tipo_de_arquivo = req.body.mimeType.replace('video/', '');
            FilePath = `video/${req?.body?.phone || '00000000000'}/${id}.${tipo_de_arquivo}`;
            Buffers = Buffer.from(req.body.video, 'base64');
        } else if (req.body.mimeType.includes('document')) {
            tipo_de_arquivo = req.body.mimeType.replace('document/', '');
            FilePath = `document/${req?.body?.phone || '00000000000'}/${id}.${tipo_de_arquivo}`;
            Buffers = Buffer.from(req.body.document, 'base64');
        }

        console.log('tipo de arquivo', tipo_de_arquivo);
        console.log('Buffer', Buffers);
        console.log('FilePath', FilePath);

        const tempFilePath = path.join("/tmp", `arquivoToSave.${tipo_de_arquivo}`); // caminho local temporário
        fs.writeFileSync(tempFilePath, Buffers);

        if (tipo_de_arquivo === 'webm') {
            const mp3FilePath = path.join("/tmp", `arquivoToSave.mp3`);

            ffmpeg(tempFilePath)
                .output(mp3FilePath)
                .on('end', () => {
                    console.log('Conversão concluída');
                    uploadToBucket(mp3FilePath, `audio/${req?.body?.phone || '00000000000'}/${id}.mp3`, res);
                })
                .on('error', (err) => {
                    console.error('Erro na conversão:', err);
                    res.status(500).json({ err });
                })
                .run();
        } else {
            uploadToBucket(tempFilePath, FilePath, res);
        }
    });
});

const uploadToBucket = (filePath, destination, res) => {
    const bucket = storage.bucket(bucketName);
    bucket.upload(filePath, {
        uploadType: 'media',
        destination: destination,
    }, (err, file) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ err });
        } else {
            file.makePublic().then(() => {
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
                return res.status(201).json({ url: publicUrl });
            }).catch(err => {
                console.log(err);
                return res.status(500).json({ err });
            });
        }
    });
};
