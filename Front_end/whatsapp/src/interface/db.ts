interface historys {
	parts	: [{text:string}];
	role 	: 'user' | 'model';
}
export interface whatsapp_message {
	messageType: string;
	content: string;
	sender: 'user' | 'model' | 'admin';
	date: number; // Alterado para 'number' para armazenar o timestamp
	view: boolean;
	id?: string;
	index_context?: number;
}
export interface history_cliente {
	avisos:number;
	bloqueio_ia:boolean;
	bloqueio_user:boolean;
	history: historys[];
	history_bloqueio: historys[];
	name:string;
	phone:string;

	whatsapp_messages: whatsapp_message[];
	user_avatar: string;
}
export interface Conversation {
	id: string;
	history_cliente:history_cliente;
	waid_view?: {
		waid: string[],
		timestamp:string
	}
	user_block_message?: boolean;
}