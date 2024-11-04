"use client";
import { useDispatch, useSelector } from "react-redux";
import LeftPanel from "../../components/home/principais/left-panel";
import RightPanel from "../../components/home/principais/right-panel";
import { AppDispatch, RootState } from "@/redux/store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { connectToFirestore } from "@/redux/slices/sliceConversations";
import { Conversation, whatsapp_message } from "@/interface/db";

export default function Home() {
    const value = useSelector((state: RootState) => state.login.value);
    const messages = useSelector((state: RootState) => state.conversation.conversations);
    const router = useRouter();
    const dispatch: AppDispatch = useDispatch();
    
    // Estado para guardar IDs das mensagens notificadas
    const [notifiedMessages, setNotifiedMessages] = useState<number[]>([]); 

    useEffect(() => {
        if (!value) router.replace('/');
    }, [value, router]);

    // Conectar ao banco de dados
    useEffect(() => {
        dispatch(connectToFirestore());
    }, [dispatch]);

    //Registro Notificacao SW
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registrado com sucesso:', registration);
                })
                .catch(error => {
                    console.error('Erro ao registrar o Service Worker:', error);
                });
        }
    }, []);
    // Notificação local
    useEffect(() => {
        // Solicitar permissão para exibir notificações
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        // Verifica se há novas mensagens
        if (messages) {
            messages.forEach((msg: Conversation) => {
                if (msg?.history_cliente?.whatsapp_messages && msg.history_cliente.whatsapp_messages.length > 0) {
                    const ultimaMensagem: whatsapp_message = msg.history_cliente.whatsapp_messages[msg.history_cliente.whatsapp_messages.length - 1];

                    // Verifica se a mensagem não foi visualizada e se ainda não foi notificada
                    if (ultimaMensagem.view === false && ultimaMensagem.sender === 'user' && !notifiedMessages.includes(ultimaMensagem.date)) {
                        console.log("A última mensagem não foi visualizada.", msg.id);

                        // Verifica se a permissão foi concedida e o Service Worker está disponível
                        if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
                            navigator.serviceWorker.getRegistration().then((registration) => {
                                if (registration) {
                                    registration.showNotification("Nova mensagem", {
                                        body: ultimaMensagem.content,
                                        icon: "/desktop-hero.png",
                                        tag: `${ultimaMensagem.date}`, // Use a data da mensagem como tag para evitar duplicatas
                                    });
                                }
                            }).catch((error) => {
                                console.error("Erro ao exibir a notificação:", error);
                            });
                        }

                        // Adiciona a data da mensagem ao estado para evitar duplicatas
                        setNotifiedMessages((prev) => [...prev, ultimaMensagem.date]);
                    } else {
                        console.log("A última mensagem foi visualizada ou já foi notificada.");
                    }
                }
            });
        }
    }, [messages]);
    

    if (!value) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="p-10 rounded-md shadow-md">
                <p className="text-center text-lg font-medium">Você não está logado</p>
            </div>
        </div>
    );

    return (
        <div className='flex overflow-y-hidden h-[calc(100vh-50px)] max-w-[1700px] mx-auto bg-left-panel'>
            <ResizablePanelGroup direction="horizontal">
                {/* Decorador de fundo verde para o modo claro */}
                <div className='fixed top-0 left-0 w-full h-36 bg-green-primary dark:bg-transparent -z-30' />
                <ResizablePanel>
                    <LeftPanel />
                </ResizablePanel>
                <ResizableHandle
                    withHandle
                    style={{ width: "10px" }}
                />
                <ResizablePanel>
                    <RightPanel />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
