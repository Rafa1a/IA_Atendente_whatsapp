import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookX, BookmarkPlus } from "lucide-react";
import { Conversation } from "@/interface/db";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { update_user_block_message } from "@/redux/slices/sliceConversations";

const ClienteAddDialog = () => {
    const [open, setOpen] = useState(false);
    const [blockArray, setBlockArray] = useState<Conversation[]>([]);
    
    const conversations = useSelector((state: RootState) => state.conversation.conversations);
    const dispatch: AppDispatch = useDispatch();

    useEffect(() => {
        const blockedConversations = conversations.filter((conv) => conv.user_block_message);
        setBlockArray(blockedConversations);
    }, [conversations]);
    const handle_user_block = (id: string) => {
        dispatch(update_user_block_message(id, false));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <BookX size={20} />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="my-2">Lista de Bloqueados</DialogTitle>
                    <DialogDescription>
                        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                            {blockArray.map((conversation) => (
                                <div key={conversation.id} className="flex flex-row justify-between items-center border-b border-gray-300 pb-2 mb-2">
                                    <div>
                                        <p className="text-sm font-medium">{conversation.history_cliente.name}</p>
                                        <p className="text-sm font-medium text-gray-600">{conversation.history_cliente.phone}</p>
                                    </div>
                                    <Button variant="outline" size="icon" className="bd-transparent border-0" onClick={() => handle_user_block(conversation.id)}>
                                        <BookmarkPlus size={18} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};

export default ClienteAddDialog;
