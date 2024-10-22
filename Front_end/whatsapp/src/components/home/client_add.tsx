import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquareDiff } from "lucide-react";
import { Conversation } from "@/interface/db";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";
import { add_new_conversation } from "@/redux/slices/sliceConversations";

const ClienteAddDialog = () => {
    //adicionar um numero para conversar:
    const [nome, setNome] = useState("");
	const [numero, setNumero] = useState("55");
    const [open, setOpen] = useState(false);
	const dispatch : AppDispatch = useDispatch();


	const handleAddClient = () => {
		if (nome && numero) {
			const conversation:any = {
                history_cliente: {
                    phone: numero,
                    name: nome,
                    user_avatar: "/placeholder.png",
                    whatsapp_messages: [],
    
                    avisos: 0,
                    bloqueio_ia: false,
                    bloqueio_user: false,
                    history:[],
                    history_bloqueio:[],
                }
            };
            dispatch(add_new_conversation(conversation, numero))
            setOpen(false);
			setNome("");
			setNumero("55");
		} else {
			alert("Por favor, preencha todos os campos.");
		}
	};

	return (
		<Dialog  open={open} onOpenChange={setOpen}>
			<DialogTrigger>
                <MessageSquareDiff size={20} />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='my-2'>Adicione o contato</DialogTitle>
					<DialogDescription>
						<div className='flex flex-col gap-3'>
							<Input
								placeholder="Nome"
								value={nome}
								onChange={(e) => setNome(e.target.value)}
							/>
							<Input
								placeholder="Número de Celular"
								value={numero}
								onChange={(e) => setNumero(e.target.value)}
							/>
							<Button onClick={handleAddClient}>Adicionar Cliente</Button>
						</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};

export default ClienteAddDialog;
