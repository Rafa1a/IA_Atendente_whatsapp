"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessageInput from "../message-input";
import MessageContainer from "../message-container";
import ChatPlaceHolder from "@/components/home/chat-placeholder";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useEffect, useState } from "react";
import { whatsapp_message } from "@/interface/db";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { update_history_cliente_bloqueio_user, update_marcado } from "@/redux/slices/sliceConversations";
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label";

const RightPanel = () => {
	const selectedConversation = useSelector((state: RootState) => state.conversation.click_conversation);
	const conversations = useSelector((state: RootState) => state.conversation.conversations);
	const _marcado = useSelector((state: RootState) => state.conversation.marcado);
	const dispatch : AppDispatch = useDispatch();
	
	//Selecionar a conversa correta 
	const [conversationName, setConversationName] = useState("Carregando");
	const [avatar, setAvatar] = useState("");
	const [mensagens, setMensagens] = useState<whatsapp_message[]>([]);
	const [bloqueio_user, setBloqueio_user] = useState(false);
	const [bloqueio_ia, setBloqueio_ia] = useState(false);


	useEffect(() => {
		if (conversations) {
			const conversation = conversations.find(
				(conversation) => conversation.id === selectedConversation
			);
			if (conversation) {
				setConversationName(conversation.history_cliente.name);
				setAvatar(conversation.history_cliente.user_avatar);
				setMensagens(conversation.history_cliente.whatsapp_messages);
				setBloqueio_user(conversation.history_cliente.bloqueio_user);
				setBloqueio_ia(conversation.history_cliente.bloqueio_ia);
			}
		}
		// console.log(selectedConversation);
	}, [conversations, selectedConversation]);
	//Bloqueio 

	// const isGroup = true;
	if (!selectedConversation) return <ChatPlaceHolder />;
	return (
		<div className='flex flex-col h-full'>
			<div id="header" className='w-full sticky top-0 z-50'>
				{/* Header */}
				<div className='flex justify-between bg-gray-primary p-3'>
					<div className='flex gap-3 items-center'>
						<Avatar>
							<AvatarImage src={avatar || "/placeholder.png"} className='object-cover' />
							<AvatarFallback>
								<div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full' />
							</AvatarFallback>
						</Avatar>
						<div className='flex flex-col'>
							<p>{conversationName}</p>
							{/* {isGroup && <GroupMembersDialog />} */}
						</div>
					</div>

					{/* <div className='flex items-center gap-7 mr-5'>
						<a href='/video-call' target='_blank'>
							<Video size={23} />
						</a>
						<X size={16} className='cursor-pointer' />
					</div> */}
				</div>
			</div>
			{/* CHAT MESSAGES */}
			<MessageContainer id={selectedConversation} mensagens={mensagens}/>
			{/* switch bloqueio */}

			<Label htmlFor="switch" className={`flex items-center gap-2 ${bloqueio_user || bloqueio_ia? 'bg-green-600': 'bg-blue-600'} p-1`}>
				{bloqueio_ia? 
				<>
					<p className="text-white">Bloqueiado pela IA</p>

					<Switch
						id="switch"
						color="blue"
						onCheckedChange={() => {
							// console.log("Bloqueio ativado/desativado");
							dispatch(update_history_cliente_bloqueio_user(selectedConversation, false, false))

						}}
						className="ml-auto"
						checked={bloqueio_ia}
					/> 
				</>: 
				<>
					<p className="text-white">{bloqueio_user?"User está BLOQUEADO":"User está DESBLOQUEADO"}</p>

					<Switch
						id="switch"
						color="blue"
						onCheckedChange={() => {
							// console.log("Bloqueio ativado/desativado");
							dispatch(update_history_cliente_bloqueio_user(selectedConversation, !bloqueio_user, false))

						}}
						className="ml-auto"
						checked={bloqueio_user}
					/>
				</>}
			</Label>
				
			{/*Visualizar mensagem marcada id_message*/}
			{_marcado?.type ? 
			<div className='flex flex-row gap-2 p-3 justify-between bg-gray-secondary'>
				{/* text audio imagem video */}
				{_marcado && _marcado.type === 'text'? 
				<div className='flex flex-col gap-2 p-3'>
					<p className=' text-sm font-medium line-clamp-2' style={{wordBreak: 'break-all'}}>{_marcado.content_message}</p>
				</div>
				: null}
				{_marcado && _marcado.type === 'image'? 
				<div className='flex flex-col gap-2 p-3'>
				  <img src={_marcado.content_message} alt='imagem' className='w-40 h-auto rounded-lg' /> 
				</div>
				: null}
				{_marcado && _marcado.type === 'audio'? 
				<div className='flex flex-col gap-2 p-3'>
					<audio controls src={_marcado.content_message} className=' rounded-lg' />
				</div>
				: null}
				{_marcado && _marcado.type === 'video'? 
				<div className='flex flex-col gap-2 p-3'>
					<video controls src={_marcado.content_message} className='w-40 rounded-lg' />
				</div>
				: null}
				{_marcado && _marcado.type === 'document'? 
				<div className='flex flex-col gap-2 p-3 '> 
				  <a href={_marcado.content_message} download className='text-blue-500 hover:underline ' style={{wordBreak: 'break-all'}}>
					{_marcado.content_message}
				  </a>
				</div>
				
				: null}
				<Button variant='outline' size='icon' className="bd-transparent border-0" onClick={() => {
					const marcado_ = {
						id_message: '',
						content_message: '',
						type: '',
						index_number: -1
					}
					dispatch(update_marcado(marcado_))
				} }>
					<X size={16} className='cursor-pointer' />
				</Button>
				
			</div>
			: null}
			{/* INPUT */}
			<MessageInput id={selectedConversation} mensagens={mensagens} />
		</div>
	);
};
export default RightPanel;