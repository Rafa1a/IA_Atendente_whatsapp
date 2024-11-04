// src/redux/reducers/index.js
import { combineReducers } from '@reduxjs/toolkit';
import loginReducer from '../slices/sliceLogin';
import conversationReducer from '../slices/sliceConversations';


const rootReducer = combineReducers({
  login: loginReducer,
  conversation: conversationReducer,
});

export default rootReducer;
