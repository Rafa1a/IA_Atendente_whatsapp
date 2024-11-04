import { Mic, Plus, Send, Pause, X } from "lucide-react"; 
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { AppDispatch, RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { update_marcado, updateWhatsapp_messages } from "@/redux/slices/sliceConversations";
import { GRAPH_API_TOKEN, whatsapp_message } from "@/interface/db";
import { Ellipsis } from 'lucide-react';
import TemplatetextDialog from "./TemplatetextDialog";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/auth/auth";


const MessageInput = ({ id, mensagens }: { id: string, mensagens: whatsapp_message[] }) => {
    const [msgText, setMsgText] = useState("");
    const dispatch: AppDispatch = useDispatch();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const _marcado = useSelector((state: RootState) => state.conversation.marcado);


    //Loading
    const [loading, setLoading] = useState(false);
    ///////////////////////////////FUNCOES////////////////////////////////
    const uploadMedia = async (file: Blob, type: string) => {
        const phone_number_id = 402300149635742; 
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('messaging_product', 'whatsapp');

        const response = await fetch(`https://graph.facebook.com/v20.0/${phone_number_id}/media`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            body: formData,
        });

        if (!response.ok) {
            console.log(`HTTP error! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response}`);
        }

        const data = await response.json();
        console.log(data);
        return data.id; 
    };

    const resposta_cliente = async (content: string, number: string, midiatype:string, media_id?:string, context?:string) => {
        const phone_nunber_id = 402300149635742;
        
        const messageBody:any = {
            messaging_product: 'whatsapp',
            recipient_type: "individual",
            to: number,
            type: midiatype,
        };

        if(context){
            messageBody['context'] = { message_id: context, };
        }   

        if (midiatype === 'text') {
            messageBody['text'] = { body: content };
        } else if (midiatype === 'audio') {
            messageBody['audio'] = { id: media_id };
        } else if (midiatype === 'image') {
            messageBody['image'] = { id: media_id };
        } else if (midiatype === 'video') {
            messageBody['video'] = { id: media_id };
        } else if (midiatype === 'document') {
            messageBody['document'] = { id: media_id };
        }

        const response = await fetch(
            `https://graph.facebook.com/v20.0/${phone_nunber_id}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageBody),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log(responseData.messages[0].id);
        return responseData.messages[0].id;
    };
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Função para lidar com o envio do texto
    const handleSubmit = async () => {
        //verificar id_message
        let id_message = '';
        if(_marcado?.type){
            id_message = _marcado?.id_message;
        }
        console.log('id_message: ', _marcado);
        const id_user_message = await resposta_cliente(msgText, id, 'text','',id_message);

        const novaMensagem: whatsapp_message = {
            messageType: 'text',
            content: msgText,
            sender: 'admin',
            date: Date.now(),
            view: true,
            id: id_user_message,
            index_context: _marcado.index_number
        };
        console.log(novaMensagem);
        const novasMensagens = [...mensagens, novaMensagem];
        
        // console.log('id_message: ', id_message);
        dispatch(updateWhatsapp_messages(id, novasMensagens));
        dispatch(update_marcado({id_message: '', content_message: '', type: '', index_number: -1}))
        setMsgText("");
    };

    // Funções de gravação de áudio já existentes
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const hasCancelledRef = useRef(false);

    const handleAudioRecording = async () => {
        if (isRecording) {
            if (isPaused) {
                // Retomar a gravação
                mediaRecorderRef.current?.resume();
                setIsPaused(false);
                setLoading(true);

            } else {
                // Pausar a gravação
                mediaRecorderRef.current?.pause();
                setIsPaused(true);
                setLoading(false);
            }
        } else {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            hasCancelledRef.current = false; 

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
    
            mediaRecorder.onstop = async () => {
                if (hasCancelledRef.current) {
                    // Se o áudio foi cancelado, não processar o envio
                    setLoading(false);
                    return;
                }
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
                const reader: any = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result.split(',')[1];
    
                    try {
                        const response = await fetch('https://URL_audio', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ audio: base64Audio, mimeType: 'audio/webm', phone:id }),
                        });
    
                        if (response.ok) {
                            const data = await response.json();
                            const mp3Url = data.url; // URL do arquivo MP3
    
                            // Obtém o conteúdo do arquivo MP3 a partir da URL
                            const mp3Response = await fetch(mp3Url);
                            const mp3Blob = await mp3Response.blob();
    
                            // Faz o upload do MP3 Blob
                            const mediaId = await uploadMedia(mp3Blob, 'audio/mp3');
                            //verificar id_message
                            let id_message = '';
                            if(_marcado?.type){
                                id_message = _marcado?.id_message;
                            }
                            // console.log('id_message: ', id_message);
                            const id_user_message = await resposta_cliente('', id, 'audio', mediaId, id_message);
    
                            const novaMensagem: whatsapp_message = {
                                messageType: 'audio',
                                content: mp3Url,
                                sender: 'admin',
                                date: Date.now(),
                                view: true,
                                id: id_user_message,
                                index_context: _marcado.index_number
                            };
    
                            const novasMensagens = [...mensagens, novaMensagem];
                            dispatch(updateWhatsapp_messages(id, novasMensagens));
                            dispatch(update_marcado({id_message: '', content_message: '', type: '', index_number: -1}))

                            setLoading(false);
                        } else {
                            console.error('Erro ao enviar o áudio:', response.statusText);
                            setLoading(false);
                        }
                    } catch (error) {
                        console.error('Erro ao enviar o áudio:', error);
                        setLoading(false);
                    }
                };
            };
    
            mediaRecorder.start();
            setIsRecording(true);
        }
    };
    // Função para parar a gravação
    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        setIsPaused(false);
    };

    // Função para cancelar a gravação
    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            hasCancelledRef.current = true; // Marcar como cancelado
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); // Parar todas as tracks do stream
            audioChunksRef.current = [];
            setIsRecording(false);
            setIsPaused(false);
        }
    };

    // Funções de upload de imagem, vídeo, PDF e DOC
    const handleMediaUpload = () => {
        fileInputRef.current?.click();
    };

    const RetornarUrl = async (file: any, type:any) => {
    
        if (file) {
            const storageRef = ref(storage, `${type}/${id}/${file.name}`); 
            console.log(`${type}/${id}/${file.name}`);
            try {
                // Faça o upload do arquivo
                const snapshot = await uploadBytes(storageRef, file);
        
                // Recupere a URL de download do arquivo
                const downloadURL = await getDownloadURL(snapshot.ref);
        
                console.log("Arquivo carregado com sucesso. URL:", downloadURL);
                return downloadURL
            } catch (error) {
                console.error("Erro ao fazer upload:", error);
                setLoading(false);
            }
            }
    };
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setLoading(true);
        const file = event.target.files?.[0];
    
        if (file) {
            let fileType = '';
            let mimeType = '';

            if (file.type.startsWith('image/')) {
                fileType = 'image';
                mimeType = 'image/jpeg';
            } else if (file.type.startsWith('video/')) {
                fileType = 'video';
                mimeType = 'video/mp4';
            } else if (file.type === 'application/pdf') {
                fileType = 'document';
                mimeType = 'document/pdf';
            } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                fileType = 'document';
                mimeType = file.type === 'application/msword'? "document/doc" : "document/docx";
            }

            if (fileType) {
                console.log(mimeType);
                try {
                    const reader: any = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = async () => {
                        const base64Media = reader.result.split(',')[1];
                        let body_arquvivo = {};

                        if (fileType === 'image') {
                            body_arquvivo = { image: base64Media, mimeType };
                        } else if (fileType === 'video') {
                            body_arquvivo = { video: base64Media, mimeType };
                        } else if (fileType === 'document' ) {
                            body_arquvivo = { document: base64Media, mimeType };
                        } 

                        console.log(body_arquvivo);
                        try {
                            
                            const url = await RetornarUrl(file, fileType);
                            console.log(url);
                            
                            if (url) {
                                const mediaId = await uploadMedia(file, mimeType);
                                //verificar id_message
                                let id_message = '';
                                if(_marcado?.type){
                                    id_message = _marcado?.id_message;
                                }
                                console.log('id_message: ', id_message);
                                const id_user_message = await resposta_cliente('', id, fileType, mediaId, id_message);

                                const novaMensagem: whatsapp_message = {
                                    messageType: fileType,
                                    content: url,
                                    sender: 'admin',
                                    date: Date.now(),
                                    view: true,
                                    id: id_user_message,
                                    index_context: _marcado.index_number
                                };

                                const novasMensagens = [...mensagens, novaMensagem];
                                dispatch(updateWhatsapp_messages(id, novasMensagens));
                                dispatch(update_marcado({id_message: '', content_message: '', type: '', index_number: -1}))

                                // Reseta o valor do input para permitir um novo upload
                                event.target.value = ''; 
                                setLoading(false);
                            } else {
                                console.error(`Erro ao enviar o ${fileType}:`);
                                setLoading(false);
                            }
                        } catch (error) {
                            console.error(`Erro ao enviar o ${fileType}:`, error);
                            setLoading(false);
                        }
                    };
                } catch (error) {
                    console.error(`Erro ao enviar o ${fileType}:`, error);
                    setLoading(false);
                }
            }
        }
    }
    return (
        <div id="messageInput" className='bg-gray-primary p-2 flex gap-4 items-center'>
            <div className='relative flex gap-2 ml-2'>
                <TemplatetextDialog id={id} mensagens={mensagens} />

                <Button 
                    size={"sm"}
                    className='bg-transparent text-foreground hover:bg-transparent'
                    onClick={()=>{
                        if(!loading){
                            handleMediaUpload();
                        }
                    }}>
                        {loading? <Ellipsis className='text-gray-600 dark:text-gray-400' /> : <Plus className='text-gray-600 dark:text-gray-400' />}
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </div>

            <div className="flex-grow">
                <textarea
                  placeholder="Message"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  className='w-full p-2 text-sm bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-y' 
                />
                
            </div>
            {msgText.length > 0 ?
            <Button 
                onClick={handleSubmit} 
                variant="ghost" 
                className='bg-transparent text-foreground hover:bg-transparent'>
                <Send className='text-gray-600 dark:text-gray-400' />
            </Button>
            :
           <div className="flex items-center gap-2">
                <Button
                    onClick={()=>{
                        if(!loading || isRecording){
                            setLoading(true);
                            handleAudioRecording();
                        }
                    }}
                    variant="ghost"
                    className='bg-transparent text-foreground hover:bg-transparent'>
                    {isRecording ? (
                        isPaused ? <Mic className='text-yellow-500' /> : <Pause className='text-red-500' />
                    ) : (
                        loading? <Ellipsis className='text-gray-600 dark:text-gray-400' /> : <Mic className='text-gray-600 dark:text-gray-400' />
                    )}
                </Button>
                {isRecording && (
                    <>
                        <Button
                            onClick={stopRecording}
                            variant="ghost"
                            className='bg-transparent text-foreground hover:bg-transparent'>
                            <Send className='text-gray-600 dark:text-gray-400' />
                        </Button>
                        <Button
                            onClick={cancelRecording}
                            variant="ghost"
                            className='bg-transparent text-foreground hover:bg-transparent'>
                            <X className='text-gray-600 dark:text-gray-400' />
                        </Button>
                    </>
                )}
            </div>}
        </div>
    );
};

export default MessageInput;
