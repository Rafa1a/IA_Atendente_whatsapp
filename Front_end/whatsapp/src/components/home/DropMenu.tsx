"use client";
import { storage } from "@/auth/auth";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { whatsapp_message } from "@/interface/db";
import { update_marcado, updateWhatsapp_messages } from "@/redux/slices/sliceConversations";
import { AppDispatch } from "@/redux/store";
import { deleteObject, ref } from "firebase/storage";
import {EllipsisVertical, Trash2, ChevronsLeft  } from 'lucide-react';
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const DropMenu = ({index, displayedMessages, phone, mensagens} : {index: number, displayedMessages: whatsapp_message[],phone:string, mensagens: whatsapp_message[]}) => {
    //Delete message
    const dispatch: AppDispatch = useDispatch();
    const [message_select, setMessage_select] = useState<whatsapp_message>();
    useEffect(()=>{
        setMessage_select(displayedMessages[index])
    },[index,displayedMessages])
    const handle_Delete = async () => {
        // console.log("Index da mensagem a ser excluída:", index);
        // console.log("Mensagens visíveis antes da exclusão:", displayedMessages);
        // console.log("Todas as mensagens antes da exclusão:", mensagens);
    
        // Obtendo a mensagem que está sendo excluída
        const mensagemToDelete = mensagens[mensagens.length - displayedMessages.length + index];

        // Verificando se a mensagem contém uma URL de arquivo
        if (mensagemToDelete && (mensagemToDelete.messageType === 'audio' || mensagemToDelete.messageType === 'image' || mensagemToDelete.messageType === 'video' || mensagemToDelete.messageType === 'document') ) {
            const messageContent  = mensagemToDelete?.content || ''; // Captura a URL da mensagem
            if (messageContent){
                const fileUrl = messageContent.match(/https:\/\/[^\s]+/)?.[0]
                if(fileUrl){
                    await deleteFileFromUrl(fileUrl); // Deleta o arquivo no Firebase Storage
                }
            }
        }
        const newMensagens = mensagens.filter((_, i) => i !== mensagens.length - displayedMessages.length + index);
    
        // console.log("Número de mensagens restantes após exclusão:", newMensagens.length);
        
        // Atualizando o estado global com as mensagens após a exclusão
        dispatch(updateWhatsapp_messages(phone, newMensagens));
    };
    const deleteFileFromUrl = async (fileUrl: string) => {
        try {
        // Cria um objeto URL para processar a string da URL
        const url = new URL(fileUrl);
    
        // Verifica se o caminho contém `/o/` (para URLs complexas)
        let path = "";
        if (url.pathname.includes("/o/")) {
            // Para URLs complexas do tipo Firebase (com /o/ e %2F)
            path = url.pathname.split("/o/")[1].split("?")[0];
        } else {
            const prefixLength = 'meu-bucket-exemplo'.length;
            // Para URLs mais simples (sem /o/ e diretamente acessíveis)
            if (url.pathname.startsWith('meu-bucket-exemplo')) {
                path = url.pathname.slice(prefixLength);
            }else {
                path = url.pathname;
            }
        }
    
        // Decodifica o caminho do arquivo para remover %2F e outras codificações
        const filePath = decodeURIComponent(path);
        // Cria uma referência ao arquivo no Firebase Storage
        const fileRef = ref(storage, filePath);

        // Deleta o arquivo do Firebase Storage
        await deleteObject(fileRef);
        console.log("File path to delete:", filePath);
    
        //   console.log("File deleted successfully.");
        } catch (error) {
        console.error("Error deleting file:", error);
        }
    }; 
    //Marcar Mesansagem
    
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild className='bg-transparent relative'>
				<Button variant='outline' size='icon' className="bd-transparent border-0">
                    <EllipsisVertical/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='bg-gray-primary'>
                {message_select?.id ? 
                <DropdownMenuItem onClick={()=>{
                    const marcado_ = {
                        id_message: message_select.id,
                        content_message: message_select.content,
                        type: message_select.messageType,
                        index_number: mensagens.length - displayedMessages.length + index
                    }
                    dispatch(update_marcado(marcado_))
                    console.log(mensagens.length - displayedMessages.length + index);
                }}>
                    <div className="flex items-center gap-2">
                        <ChevronsLeft size={16} />
                        <p>Responder</p>
                    </div>
                </DropdownMenuItem> 
                : null}
                    
				<DropdownMenuItem onClick={handle_Delete}>
                    <div className="flex items-center gap-2">
                        <Trash2 size={16} />
                        <p>Delete</p>
                    </div>
                </DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
export default DropMenu;