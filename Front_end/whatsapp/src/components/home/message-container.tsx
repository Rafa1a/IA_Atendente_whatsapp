import { useEffect, useRef, useState } from "react";
import { whatsapp_message } from "@/interface/db";
import { RotateCcw, CheckCheck } from 'lucide-react';
import DropMenu from "@/components/home/DropMenu";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const MessageContainer = ({ id,mensagens }: { id:string,mensagens: whatsapp_message[] }) => {
	const conversations = useSelector((state: RootState) => state.conversation.conversations);
	////////////////////////////VISIBILIDADE DAS MENSAGENS (para nao sobrecarregar a renderizacao, a memória)///////////////////
	// Estado para manter o número de mensagens visíveis
    const [visibleCount, setVisibleCount] = useState(15);
    const [isImageEnlarged, setIsImageEnlarged] = useState<number | null>(null);
    const handleImageClick = (index: number) => {
        setIsImageEnlarged(isImageEnlarged === index ? null : index);
    };
    
   
    // Função para carregar mais mensagens
    const loadMoreMessages = () => {
        setVisibleCount((prevCount) => prevCount + 15);
    };

    // Atualiza a contagem de mensagens visíveis quando as mensagens mudam
    useEffect(() => {
        setVisibleCount(15);
    }, [mensagens]);

    // Mensagens a serem renderizadas (últimas `visibleCount` mensagens)
    const [displayedMessages, setDisplayedMessages] = useState<whatsapp_message[]>(mensagens);
    useEffect(() => {
        setDisplayedMessages(mensagens?.slice(Math.max(mensagens?.length - visibleCount, 0)));
    }, [visibleCount, mensagens]);
    
	/////////////////////////////SROOL ROLAR PARA BAIXO///////////////////////////////
	// Referência para o contêiner de mensagens
	const messagesEndRef = useRef<HTMLDivElement>(null);

    // Função para rolar para o fundo do contêiner de mensagens
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Atualiza o scroll 
    useEffect(() => {
        scrollToBottom();
    }, [mensagens]);
	//Front-end das Mensagens
    const render_menssagens = (msg: whatsapp_message, index: number, marcada:boolean) => {
        const isUser = msg?.sender === 'user';
        const isModel = msg?.sender === 'model';

        const estiloMensagem = isUser
            ? 'bg-green-400 dark:bg-green-800 text-white'
            : isModel
            ? 'bg-blue-400 dark:bg-blue-600 text-white'
            : 'bg-gray-400 dark:bg-gray-800 text-white';

        return (
            <>
               
                {/* Renderiza o conteúdo da mensagem Texto*/}
                {msg?.messageType === 'text' && msg?.content?
                <div className={`p-2 rounded-lg max-w-xs ${estiloMensagem} overflow-wrap break-words`}>
                    <p className={`text-sm whitespace-pre-wrap ${marcada? '' : 'line-clamp-2'}`}>{msg?.content}</p> 
                </div>
            
                : null}
                {/* Renderiza o conteúdo da mensagem image*/}
                {msg?.messageType === 'image' && msg?.content? 
                    <div className={`p-2 rounded-lg max-w-xs ${estiloMensagem} overflow-wrap break-words`}> 
                        <img 
                            src={msg?.content} 
                            alt="Imagem" 
                            className={`w-xl rounded-lg`}
                            onClick={() => {
                                if(marcada){
                                    handleImageClick(index);
                                }
                            }}
                        /> 
                    </div>
                : null}
                
                {/* Renderiza o conteúdo da mensagem audio*/}
                {msg?.messageType === 'audio' && msg?.content? <audio controls src={msg?.content} className="w-xl rounded-lg" /> : null}
                
                {/* Renderiza o conteúdo da mensagem video*/}
                {msg?.messageType === 'video' && msg?.content? 
                <div className={`p-2 rounded-lg max-w-xs ${estiloMensagem} overflow-wrap break-words`}>
                    <video controls src={msg?.content} className="w-xs rounded-lg" /> 
                </div>
                : null}
                
                {/* Renderiza o conteúdo da mensagem document*/}
                {msg?.messageType === 'document' && msg?.content? 
                <div className={`p-2 rounded-lg max-w-xs ${estiloMensagem} overflow-wrap break-words`}>
                    <a 
                    href={msg?.content} 
                    download 
                    className="text-white-600 hover:underline"
                    target="_blank" 
                    rel="noopener noreferrer"
                        >
                        {msg?.content}
                    </a> 
                </div>
                : null}
            </>

        );
    };
    /////////////////////////////////////////////////VIEW MENSAGEM ////////////////////////////////////////////
    const [lastViewedMessageIndex, setLastViewedMessageIndex] = useState(-1);
    const [lastIndex, setLastIndex] = useState(-1);

    useEffect(()=>{
        console.log(lastViewedMessageIndex)
        if(lastViewedMessageIndex != -1) setLastIndex(lastViewedMessageIndex)
    },[lastViewedMessageIndex])

    useEffect(()=>{
        const dados_user_phone = conversations.find(data => data.id === id);
        // Obter o último ID visualizado (maior índice) em waid_view.waid
        
        if (dados_user_phone?.waid_view?.waid) {
            setLastViewedMessageIndex(-1)
            // Percorre cada waid e encontra o índice correspondente no array displayedMessages
            let lastIndexx = -1;
            dados_user_phone.waid_view.waid.forEach(waid => {
                // console.log(' rafa aki')
                console.log('waid',waid)
                const messageIndex = displayedMessages.findIndex(m => m.id === waid);
                if ((messageIndex > lastIndexx) ) {
                    console.log('messageIndex',messageIndex)
                    lastIndexx = messageIndex;
                }
            });
            console.log('lastIndexx',lastIndexx)
            setLastViewedMessageIndex(lastIndexx); // Atualiza se encontrar um índice maior

        }else {
            setLastViewedMessageIndex(-2)
            // console.log('oxiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii')
        }
        // console.log('lastViewedMessageIndex',lastViewedMessageIndex )
    },[displayedMessages,mensagens]) 

    const renderMessage = (msg: whatsapp_message, index: number) => {
        const isUser = msg.sender === 'user';
        const estiloAlinhamento = isUser ? 'justify-end' : 'justify-start';
        const estiloAlinhamento_coluna = isUser ? 'end' : 'start';
        
        const data = new Date(msg.date);
        const horaFormatada = data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dataFormatada = data.toLocaleDateString();
        
        // Determinar se o ícone deve ser verde para esta mensagem
        // console.log('index',index)
        // console.log('lastViewedMessageIndex',lastIndex)
        let waid_view = index <= lastIndex;
        // console.log('waid_view',waid_view)


        return (
            <div
                key={index}
                style={{ alignItems: 'center' }}
                className={`flex ${estiloAlinhamento} w-full mb-2`}
            >
                <div
                    style={{ alignItems: `${estiloAlinhamento_coluna}` }}
                    className={`flex flex-col mb-2`}
                >
                    {/* Renderiza o conteúdo MARCADO */}
                    {msg?.index_context && msg?.index_context >= 0 ? 
                    <div className={`rounded-lg max-w-xs overflow-wrap break-words border-2 border-blue-700`}>
                        {render_menssagens(mensagens[msg.index_context], msg.index_context, false)}
                    </div> 
                    : null}
                    
                    {render_menssagens(msg, index, true)}

                    <div className="flex flex-row ">
                        <div className="text-xs text-gray-500 hover:text-gray-400 hover:text-sm" title={`${horaFormatada}, ${dataFormatada}`}>
                            {dataFormatada} {' '} {horaFormatada}
                        </div>
                        
                        {/* Renderize o ícone CheckCheck baseado na visualização */}
                        {msg.sender === 'admin' ? (
                            <CheckCheck
                                className={`ml-2 ${waid_view ? 'text-green-500' : 'text-gray-500'}`}
                                size={16}
                            />
                        ) : null}
                    </div>
                </div>

                <DropMenu index={index} displayedMessages={displayedMessages} phone={id} mensagens={mensagens} />
            </div>
        );
    };
    
    

    return (
        <div className="relative p-3 flex-1 overflow-auto h-full bg-chat-tile-light dark:bg-chat-tile-dark">
			{/* Botão para carregar mais mensagens */}
            {visibleCount < mensagens?.length && (
                <div className="flex justify-center">
                    <button onClick={loadMoreMessages} className="p-1">
                        <RotateCcw />
                    </button>
                </div>
            )}
            {/* Renderiza mensagens */}
            <div className="flex flex-col">
                {displayedMessages?.map((msg, index) => renderMessage(msg, index))}
                <div ref={messagesEndRef} />
            </div>
            {isImageEnlarged !== null && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={() => setIsImageEnlarged(null)}
                >
                    <img 
                        src={displayedMessages[isImageEnlarged].content} 
                        alt="Imagem ampliada" 
                        className="max-w-full max-h-full"
                    />
                </div>
            )}
            
        </div>
    );
};

export default MessageContainer;
