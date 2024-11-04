import { useEffect, useState } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { ListFilter, LogOut, MessageSquareDiff, Search, User } from "lucide-react";
import { Input } from "../../ui/input";
import ThemeSwitch from "../theme-switch";
import Conversations from "../conversation";
import { useDispatch, useSelector } from "react-redux";
import { off } from "@/redux/slices/sliceLogin";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { AppDispatch, RootState } from "@/redux/store";
import { Conversation } from "@/interface/db";
import ClienteAddDialog from "../client_add";
import Clients_block from "../Clients_block"

const LeftPanel = () => {
	const conversations = useSelector((state: RootState) => state.conversation.conversations);
	const router = useRouter();
	const [listHeight, setListHeight] = useState(0);
	const [sortedConversations, setSortedConversations] = useState<Conversation[]>(conversations);
	const [searchTerm, setSearchTerm] = useState(""); // Estado para o termo de pesquisa

	const dispatch: AppDispatch = useDispatch();
	//Tamanho dinamico dos itens List
	useEffect(() => {
		const updateHeight = () => {
			setListHeight(window.innerHeight);
		};

		updateHeight();

		window.addEventListener("resize", updateHeight);
		return () => window.removeEventListener("resize", updateHeight);
	}, []);
	// Ordem de mensagens e filtro baseado na pesquisa
	useEffect(() => {
		if (conversations) {
			const filteredConversations = conversations.filter((conversation) =>
				conversation.history_cliente.name.toLowerCase().includes(searchTerm.toLowerCase())
			);

			const sorted = filteredConversations.slice().sort((a, b) => {
				const lastMessageA = a?.history_cliente?.whatsapp_messages?.slice(-1)[0]?.date || 0;
				const lastMessageB = b?.history_cliente?.whatsapp_messages?.slice(-1)[0]?.date || 0;

				return lastMessageB - lastMessageA;
			});

			const sorted_nonBlock = sorted.filter(conversation => !conversation.user_block_message);
			setSortedConversations(sorted_nonBlock);
		}
	}, [conversations, searchTerm]);

	const renderRow = ({ index, style }: ListChildComponentProps) => {
		const conversation = sortedConversations[index];
		return (
		<div style={style} key={conversation.id}>
			<Conversations conversation={conversation.history_cliente} id={conversation.id} />
		</div>
		);
	};
	
	return (
		<div className="border-gray-600 border-r h-full flex flex-col gap-3">
		<div id="header" className="sticky top-0 bg-left-panel z-10">
			<div className="flex justify-between bg-gray-primary p-3 items-center">
			<User size={24} />
			<div className="flex items-center gap-3">
				<Clients_block />
				<ClienteAddDialog />
				<ThemeSwitch />
				<LogOut
				size={20}
				className="cursor-pointer"
				onClick={() => {
					getAuth().signOut();
					dispatch(off());
					router.replace("/");
				}}
				/>
				
			</div>
			</div>

			<div className="p-3 flex items-center">
				<div className="relative h-10 mx-3 flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10" size={18} />
					<Input
							type="text"
							placeholder="Pesquise clientes"
							className="pl-10 py-2 text-sm w-full rounded shadow-sm bg-gray-primary focus-visible:ring-transparent"
							onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o termo de pesquisa
					/>
				</div> 
			{/* <ListFilter className="cursor-pointer" onClick={() => {
				////////////////////////FUNCAO TESTE APENAS PARA VERIFICAR O REDUX EXCLUIR POSTERIORMENTE//////////////////
				// const newconversations_test = conversations.map(conversation => ({
				// 	...conversation,
				// 	history_cliente: {
				// 		...conversation.history_cliente,
				// 		whatsapp_messages: conversation.history_cliente.whatsapp_messages.map(message => ({
				// 			...message
				// 		}))
				// 	}
				// }));

				// // Mudando a data na cópia do objeto
				// newconversations_test[0].history_cliente.whatsapp_messages[3].date = Date.now();
				
				// console.log(newconversations_test[0].history_cliente.whatsapp_messages[0].date);
				// console.log(newconversations_test)
				// dispatch(update_conversation(newconversations_test));
			}} />*/}

			</div>
		</div>

		{/* Chat List with react-window */}
		<List
			height={listHeight} // Altura dinâmica
			itemCount={sortedConversations.length} // Número total de itens
			itemSize={70} // Altura de cada item
			width="100%" // Largura da lista
		>
			{renderRow}
		</List>
		</div>
	);
};

export default LeftPanel;
