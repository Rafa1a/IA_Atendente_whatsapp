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
import { delete_documento, update_click_conversation, update_marcado, update_user_block_message, updateWhatsapp_messages } from "@/redux/slices/sliceConversations";
import { AppDispatch } from "@/redux/store";
import { deleteObject, listAll, ref } from "firebase/storage";
import {EllipsisVertical, PackageMinus,PackageX  , RefreshCcw   } from 'lucide-react';
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const DropMenuexcluir = ({id} : {id:string}) => {
    //funcao excluir : 
	const dispatch: AppDispatch = useDispatch();

	const [loading, setLoading] = useState(false);
    
	const handleExcluirAll = async (folderPath:any) => {
		try {
			const folderRef = ref(storage, folderPath);
		
			// Lista todos os arquivos dentro da pasta
			const result = await listAll(folderRef);
			// console.log(result);
		
			// Loop sobre os itens e exclui cada um deles
			const deletePromises = result.items.map((itemRef:any) => {
				return deleteObject(itemRef);
			});
		
			// Aguarda a exclusão de todos os arquivos
			await Promise.all(deletePromises);
		
			console.log(`Todos os arquivos da pasta ${folderPath} foram excluídos com sucesso!`);
		} catch (error) {
			console.error("Erro ao excluir a pasta:", error);
		}
	};
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild className='bg-transparent relative'>
				<Button variant='outline' size='icon' className="bd-transparent border-0">
                    {loading? <RefreshCcw size={16}/>:<EllipsisVertical/>}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='bg-gray-primary'>
				<DropdownMenuItem onClick={async ()=>{	
                        setLoading(true);
						const audio_doc = `audio/${id}`
						const image_doc = `image/${id}`
						const video_doc = `video/${id}`
						const document_doc = `document/${id}`
						// console.log(audio_doc);
						// console.log(image_doc);
						// console.log(video_doc);
						// console.log(document_doc);
						await handleExcluirAll(audio_doc);
						await handleExcluirAll(image_doc);
						await handleExcluirAll(video_doc);
						await handleExcluirAll(document_doc);
						dispatch(updateWhatsapp_messages(id, []));
						dispatch(update_click_conversation(''));
						setLoading(false);}}>
                        <div className="flex items-center gap-2">
                            <PackageMinus size={16}/>
                            <p>Delete Conversa</p>
                        </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async ()=>{	
                        setLoading(true);
						const audio_doc = `audio/${id}`
						const image_doc = `image/${id}`
						const video_doc = `video/${id}`
						const document_doc = `document/${id}`
						// console.log(audio_doc);
						// console.log(image_doc);
						// console.log(video_doc);
						// console.log(document_doc);
						await handleExcluirAll(audio_doc);
						await handleExcluirAll(image_doc);
						await handleExcluirAll(video_doc);
						await handleExcluirAll(document_doc);
						dispatch(delete_documento(id));
						dispatch(update_click_conversation(''));
						setLoading(false);}}>
                        <div className="flex items-center gap-2">
                            <PackageX size={16} />
                            <p>Delete Cliente</p>
                        </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async ()=>{	
						dispatch(update_user_block_message(id, true));
                        }}>
                        <div className="flex items-center gap-2">
                            <PackageX size={16} />
                            <p>Bloquear Cliente</p>
                        </div>
                </DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
export default DropMenuexcluir;