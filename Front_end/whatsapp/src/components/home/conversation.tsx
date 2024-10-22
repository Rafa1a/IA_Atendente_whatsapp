import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { MessageSeenSvg } from "@/lib/svgs";
import { ImageIcon, Users, VideoIcon,AudioLinesIcon, Trash, Ellipsis  } from "lucide-react";
import { history_cliente } from "@/interface/db";
import { useDispatch} from 'react-redux';
import { update_click_conversation, update_marcado, updateWhatsapp_messages } from '@/redux/slices/sliceConversations';
import { AppDispatch } from "@/redux/store";
import { Button } from "../ui/button";
import Drop_menu_Excluir from "./Drop_menu_Excluir";

const Conversation_comp = ({ conversation,id }: { conversation: history_cliente, id:string }) => {
	const conversationImage = conversation?.user_avatar || "/placeholder.png";
	const conversationName = conversation?.name || "Sem Nome";
	const index = conversation?.whatsapp_messages?.length - 1 || 0;
	let lastMessage = null;
	let lastMessageType = null;
	if (conversation?.whatsapp_messages){
		 lastMessage = conversation?.whatsapp_messages[index];
		 lastMessageType = conversation?.whatsapp_messages[index]?.messageType;
	}
	
	const authUser = { _id: "admin" };
	// useEffect(()=>{
	// 	console.log(conversation)
	// },[])

	const dispatch: AppDispatch = useDispatch();

	const handleClick = () => {
		dispatch(update_click_conversation(id));
		dispatch(update_marcado({id_message: '', content_message: '', type: '', index_number: -1}))
		//atualizar view caso seja false
		if(conversation?.whatsapp_messages && conversation?.whatsapp_messages[index]?.view === false){
			const arraywhatsapp = conversation?.whatsapp_messages.map(message => ({
				...message,
				view: true
			}));
			dispatch(updateWhatsapp_messages(id, arraywhatsapp));
		}
	};
	
	
	return (
		<>
			<div 
				onClick={handleClick} // Adiciona o evento onClick aqui
				className={`flex gap-2 items-center p-3 hover:bg-chat-hover cursor-pointer `}
			>
				<Avatar className='border border-gray-900 overflow-visible relative'>
					
					<AvatarImage src={conversationImage} className='object-cover rounded-full' />
					<AvatarFallback>
						<div className='animate-pulse bg-gray-tertiary w-full h-full rounded-full'></div>
					</AvatarFallback>
				</Avatar>
				{
					conversation?.whatsapp_messages && conversation.whatsapp_messages.slice(-1)[0]?.view === false? 
					conversation?.bloqueio_ia || conversation?.bloqueio_user ? 
					<div className='absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full  border-foreground' /> : 
					<div className='absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full  border-foreground' /> 
					: null
				}
				

				<div className='w-full'>
					<div className='flex items-center'>
						<h3 className='text-xs lg:text-sm font-medium'>{conversationName}</h3>
						<span className='text-[10px] lg:text-xs text-gray-500 ml-auto'>
							{conversation.phone}
						</span>
					</div>
					<p className='text-[12px] mt-1 text-gray-500 flex items-center gap-1 '>
						{lastMessage?.sender === authUser?._id ? <MessageSeenSvg /> : ""}
						{/* {conversation && <Users size={16} />} */}
						{!lastMessage && "Diga oi!"}
						{lastMessage && lastMessageType === "text" ? lastMessage?.content?.length > 30 ? (
							<span className='text-xs'>{lastMessage?.content.slice(0, 30)}...</span>
						) : (
							<span className='text-xs'>{lastMessage?.content}</span>
						):null}
						{lastMessageType === "audio" && <AudioLinesIcon size={16} />}
						{lastMessageType === "image" && <ImageIcon size={16} />}
						{lastMessageType === "video" && <VideoIcon size={16} />}
					</p>
				</div>
				<Drop_menu_Excluir id={id}/>
			</div>
			<hr className='h-[1px] mx-10 bg-gray-primary' />
		</>
	);
};
export default Conversation_comp;
