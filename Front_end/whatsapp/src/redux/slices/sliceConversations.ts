import { Conversation } from '@/interface/db';
// src/redux/slices/conversationSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { AppThunk } from '../store';
import { collection, onSnapshot, doc,updateDoc, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/auth/auth';
import {whatsapp_message,history_cliente} from '@/interface/db';
interface marcado {
  id_message: string;
  content_message: string;
  type: string;
  index_number : number;
}
interface ConversationState {
    conversations: Conversation[];
    click_conversation: string;
    marcado: marcado;
}

const initialState:ConversationState = {
    conversations: [],
    click_conversation: '',
    marcado : {
        id_message: '',
        content_message: '',
        type: '',
        index_number : -1
    }
}

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    update_conversation: (state, action) => {
        state.conversations = action.payload;
    },
    update_click_conversation: (state, action) => {
        state.click_conversation = action.payload;
    },
    update_marcado: (state, action) => {
        state.marcado = action.payload;
    },
    
  },
});

export const { update_conversation, update_click_conversation, update_marcado } = conversationSlice.actions;

export default conversationSlice.reducer;

// Função para conectar ao banco de dados do Firestore
export const connectToFirestore = (): AppThunk => async (dispatch) => {
  const usersCollectionRef = collection(db, 'history_w_ia');
  onSnapshot(usersCollectionRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      }));
      dispatch(update_conversation(data));
  });
};
//atualizar view no banco de dados 
export const updateWhatsapp_messages = (id: string, whatsapp_messages: whatsapp_message[]): AppThunk => async (dispatch) => {
  const usersCollectionRef = collection(db, 'history_w_ia');
  const docRef = doc(usersCollectionRef, id);
  await updateDoc(docRef, {
    'history_cliente.whatsapp_messages': whatsapp_messages,
  });
};
//history_cliente alterar 
export const update_history_cliente_bloqueio_user = (id: string, bloqueio_user: boolean, bloqueio_ia: boolean): AppThunk => async (dispatch) => {
  const usersCollectionRef = collection(db, 'history_w_ia');
  const docRef = doc(usersCollectionRef, id);
  await updateDoc(docRef, {
    'history_cliente.bloqueio_user': bloqueio_user,
    'history_cliente.bloqueio_ia': bloqueio_ia,
  });
};
export const add_new_conversation = (conversation: Conversation, id:string): AppThunk => async (dispatch) => {
  const usersCollectionRef = collection(db, 'history_w_ia');
  const docRef = doc(usersCollectionRef, id); // Define o ID aqui
  await setDoc(docRef, conversation); // Usa setDoc para criar com o ID definido
};
//funcao para deletar documento
export const delete_documento = (id: string): AppThunk => async (dispatch) => {
  const usersCollectionRef = collection(db, 'history_w_ia');
  const docRef = doc(usersCollectionRef, id);
  await deleteDoc(docRef);
};
//funcao para mudar o valor de user_block_message
export const update_user_block_message = (id: string, user_block_message: boolean): AppThunk => async (dispatch) => {
  const usersCollectionRef = collection(db, 'history_w_ia');
  const docRef = doc(usersCollectionRef, id);
  await updateDoc(docRef, {
    'user_block_message': user_block_message,
  });
};

