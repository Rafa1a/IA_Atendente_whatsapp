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
import { MessageSquareDot  } from "lucide-react";
import { GRAPH_API_TOKEN, whatsapp_message } from "@/interface/db";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";
import { updateWhatsapp_messages } from "@/redux/slices/sliceConversations";


const TemplatetextDialog = ({ id, mensagens }: { id: string, mensagens: whatsapp_message[] }) => {
    const [open, setOpen] = useState(false);
    //template
    const [template_name, setTemplate_name] =  useState<string>('purchase_transaction_alert')
    const [conversa_template, setConversa_template] = useState<string>('')
    const dispatch: AppDispatch = useDispatch();
    const iniciar_conversa = async (number: string, templateName: string, languageCode: string, variableValue: string) => {
        const phone_number_id = 402300149635742;
    
        const messageBody = {
            messaging_product: 'whatsapp',
            to: number,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode,
                },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            {
                                type: 'text',
                                text: variableValue,
                            },
                        ],
                    },
                ],
            },
        };
    
        const response = await fetch(
            `https://graph.facebook.com/v20.0/${phone_number_id}/messages`,
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
        console.log(responseData);
        //salvar bd
        const novaMensagem: whatsapp_message = {
            messageType: 'text',
            content: variableValue,
            sender: 'admin',
            date: Date.now(),
            view: true,
        };

        const novasMensagens = [...mensagens, novaMensagem];    
        dispatch(updateWhatsapp_messages(id, novasMensagens));

    };
    
	return (
		<Dialog  open={open} onOpenChange={setOpen}>
			<DialogTrigger>
                <MessageSquareDot size={20} />
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='my-2'>Enviar mensagem Template</DialogTitle>
					<DialogDescription>
                        <div className='flex flex-col gap-3'>
                            {/* <Input
								placeholder="Template Nome"
								value={template_name}
								onChange={(e) => setTemplate_name(e.target.value)}
							/> */}
							<Input
								placeholder="Texto da mensagem"
								value={conversa_template}
								onChange={(e) => setConversa_template(e.target.value)}
							/>
							<Button onClick={()=>{
                                iniciar_conversa(id, template_name, 'pt_BR',conversa_template)
                                setOpen(false);
                                setTemplate_name('purchase_transaction_alert');
                                setConversa_template('');
                            }}>Enviar</Button>
						</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};

export default TemplatetextDialog;
