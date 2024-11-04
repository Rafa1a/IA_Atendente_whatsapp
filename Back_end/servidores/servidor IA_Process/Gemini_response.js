const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  
  const MODEL_NAME = "gemini-1.5-flash";
  const API_KEY = process.env.GENERATIVE_AI_API_KEY;
  
exports.gemini = async (ia_name,temperatura,prompt_base,arquivo_texto,history,audio_boolean,image_boolean,video_boolean,caption) => {
    const ia_name_ = ia_name.replace('models/', '');
    console.log(ia_name_);
    console.log('temperatura',temperatura);
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: ia_name_ || MODEL_NAME ,
        systemInstruction: prompt_base,
    });
   
    const generationConfig = {
        temperature: temperatura,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
    };
      
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
    if(audio_boolean){
      history.push({
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: arquivo_texto.mimeType,
              fileUri: arquivo_texto.uri,
            },
          },
        ],
      })
      // console.log('history_gemini_1:', JSON.stringify(history, null, 2))
      // CHAT
      const chatSession = model.startChat({
        generationConfig,
        safetySettings: safetySettings,
      // See https://ai.google.dev/gemini-api/docs/safety-settings
        history: history,
      });
      // console.log('history_gemini_2:', JSON.stringify(history, null, 2))

      const result = await chatSession.sendMessage("Com base no histórico da conversa e no conteúdo do áudio, responda ao áudio adicionado. Não repita o conteúdo da conversa, apenas responda ao áudio da melhor forma possível. Lembre-se de que você trabalha na Allnec e deve se comportar como um atendente. Se o áudio não puder ser respondido, simplesmente explique o motivo.");
      // console.log('history_gemini_3:', JSON.stringify(history, null, 2))
      const response = result.response;
      console.log(response.text());

      return response.text();
    } else if (video_boolean){
      history.push({
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: arquivo_texto.mimeType,
              fileUri: arquivo_texto.uri,
            },
          },
        ],
      })
      // console.log('history_gemini_1:', JSON.stringify(history, null, 2))
      // CHAT
      const chatSession = model.startChat({
        generationConfig,
        safetySettings: safetySettings,
      // See https://ai.google.dev/gemini-api/docs/safety-settings
        history: history,
      });
      // console.log('history_gemini_2:', JSON.stringify(history, null, 2))
      if (caption) {
        const result = await chatSession.sendMessage(caption);
        // console.log('history_gemini_3:', JSON.stringify(history, null, 2))
        const response = result.response;
        console.log(response.text());
  
        return response.text();
      }else {
        const result = await chatSession.sendMessage("Com base no histórico da conversa e no conteúdo do vídeo, responda ao vídeo adicionado. Não repita o conteúdo da conversa, apenas responda ao vídeo da melhor forma possível. Lembre-se de que você trabalha na Allnec e deve se comportar como um atendente. Se o vídeo não puder ser respondido, simplesmente explique o motivo.");
        // console.log('history_gemini_3:', JSON.stringify(history, null, 2))
        const response = result.response;
        console.log(response.text());
  
        return response.text();
      }
     
    }else if (image_boolean) {
      history.push({
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: arquivo_texto.mimeType,
              fileUri: arquivo_texto.uri,
            },
          },
        ],
      })
      // console.log('history_gemini_1:', JSON.stringify(history, null, 2))
      // CHAT
      const chatSession = model.startChat({
        generationConfig,
        safetySettings: safetySettings,
      // See https://ai.google.dev/gemini-api/docs/safety-settings
        history: history,
      });
      // console.log('history_gemini_2:', JSON.stringify(history, null, 2))
      if (caption) {
        const result = await chatSession.sendMessage(caption);
        // console.log('history_gemini_3:', JSON.stringify(history, null, 2))
        const response = result.response;
        console.log(response.text());
  
        return response.text();
      }else {
        const result = await chatSession.sendMessage("Com base no histórico da conversa e no conteúdo da imagem, responda a imagem adicionado. Não repita o conteúdo da conversa, apenas responda a imagem da melhor forma possível. Lembre-se de que você trabalha na Allnec e deve se comportar como um atendente. Se a imagem não puder ser respondido, simplesmente explique o motivo.");
        // console.log('history_gemini_3:', JSON.stringify(history, null, 2))
        const response = result.response;
        console.log(response.text());
  
        return response.text();
      }
    }else {
      // CHAT
      const chatSession = model.startChat({
        generationConfig,
        safetySettings: safetySettings,
      // See https://ai.google.dev/gemini-api/docs/safety-settings
        history: history,
      });
      // console.log('history_gemini_2:', JSON.stringify(history, null, 2))

      const result = await chatSession.sendMessage(arquivo_texto);
      // console.log('history_gemini_3:', JSON.stringify(history, null, 2))

      const response = result.response;
      console.log(response.text());

      return response.text();
    }
}
exports.gemini_g = async (prompt_base,arquivo,inputsandoutputs,caption) => {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
    const generationConfig = {
      temperature: 0.6,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    };
    
  
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
    
    // input e outputs treinamento
    // console.log(inputsandoutputs)
    if (inputsandoutputs) {
      let parts 
      if (typeof arquivo == 'string') {
        parts = [
          { text: prompt_base },
          ...inputsandoutputs,
          { text: `input: ${arquivo}` },
          { text: "output: " },
        ];
      } else {

        if(caption){
          parts = [
            { text: prompt_base },
            ...inputsandoutputs,
            { text: "input: " },
            { text: caption },
            {
              fileData: {
                mimeType: arquivo.mimeType,
                fileUri: arquivo.uri
              }
            },
            { text: "output: " },
          ];
        }else {
          console.log('ta caindo aqui po')
          parts = [
            { text: prompt_base },
            ...inputsandoutputs,
            { text: "input: " },
            {
              fileData: {
                mimeType: arquivo.mimeType,
                fileUri: arquivo.uri
              }
            },
            { text: "output: " },
          ];
        }
      }
      
      // console.log(parts);
      // console.log(prompt_base);
      // console.log(texto);
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
        safetySettings,
      });
    
      const response = result.response;
      console.log(response.text());
      return response.text();
    }
}
exports.gemini_transcricao = async (arquivo,audio_boolean,image_boolean,video_boolean) => {
  try {
    if (audio_boolean){
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
      });
    
      const generationConfig = {
        temperature: 0.6,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };
      
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ];
      
      try {
        const parts = [
          { text:  `Instruções:\n
            Apenas transcreva o arquivo de áudio.` },
          { text: 'input: ' },
          {
            fileData: {
              mimeType: arquivo.mimeType,
              fileUri: arquivo.uri
            }
          },
          { text: 'output: ' },
        ]
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
          });
        
          const response = result.response;
          console.log(response.text());
          return response.text();
      } catch (err) {
        console.error('Erro ao processar o arquivo:', err);
      }
    } else if (image_boolean){
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
      });
    
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };
      
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ];
      
      try {
        const parts = [
          { text:  `Instruções:

            Como é um arquivo de imagem, descreva a imagem da melhor forma possível. Um ponto importante é identificar o TPA2K, TPA10K ou o MT19 na imagem. Caso não tenha, Apenas descreva a imagem da melhor forma que você conseguir.

            Ajudar a localizar o aparelho correto:

            Todos são amarelos e pretos.

            TPA2K: É um aparelho pequeno que não possui nenhuma entrada para fio, pois os fios verde e cinza saem diretamente dele.

            TPA10K: Tem a entrada para a fase (cinza) e do terra (verde) e é um pouco maior que o TPA2K.

            MT19: É o único que possui 6 entradas na parte de baixo: cinza/branco (fase), verde (terra), dois azuis (-HOT e -SENSE), e dois vermelhos (+HOT e +SENSE).` },
          { text: `input: `  },
          {
            fileData: {
              mimeType: arquivo.mimeType,
              fileUri: arquivo.uri
            }
          },
          { text: 'output: ' },
        ]
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
          });
        
          const response = result.response;
          console.log(response.text());
          return response.text();
      } catch (err) {
        console.error('Erro ao processar o arquivo:', err);
      }
    } else if (video_boolean){
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
      });
    
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };
      
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ];
      
      try {
        const parts = [
          { text:  `Instruções:

            Como é um arquivo de video, descreva o video da melhor forma possível. Um ponto importante é identificar o TPA2K, TPA10K ou o MT19 no video. Caso não tenha, Apenas descreva o video da melhor forma que você conseguir, separando por parte visual:... e a parte sonora:... .

            Ajudar a localizar o aparelho correto:

            Todos são amarelos e pretos.

            TPA2K: É um aparelho pequeno que não possui nenhuma entrada para fio, pois os fios verde e cinza saem diretamente dele.

            TPA10K: Tem a entrada para a fase (cinza) e do terra (verde) e é um pouco maior que o TPA2K.

            MT19: É o único que possui 6 entradas na parte de baixo: cinza/branco (fase), verde (terra), dois azuis (-HOT e -SENSE), e dois vermelhos (+HOT e +SENSE).` },
          { text: `input: `  },
          {
            fileData: {
              mimeType: arquivo.mimeType,
              fileUri: arquivo.uri
            }
          },
          { text: 'output: ' },
        ]
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
          });
        
          const response = result.response;
          console.log(response.text());
          return response.text();
      } catch (err) {
        console.error('Erro ao processar o arquivo:', err);
      }
    }
  } catch (error) {
    console.error('Erro ao recuperar o video:', error);
    res.status(500).send('Erro ao recuperar o video.');
  }


};











