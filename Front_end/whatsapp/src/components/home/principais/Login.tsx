"use client";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithCustomToken } from "firebase/auth";
import { useEffect, useState } from "react";
import {auth }from '../../../auth/auth'; // Importe o objeto auth
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { on, off } from '../../../redux/slices/sliceLogin';
function App() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const authInstance = getAuth(auth); // Obtenha a instância de autenticação
    
    // Monitora o estado de autenticação
    onAuthStateChanged(authInstance, (user) => {
      if (user) {
        // Usuário está logado
        setLoading(false);
        setUser(user);
        dispatch(on())
        router.replace('/init');
      } else {
        // Usuário está deslogado
        setLoading(false);
        setUser(null);
        dispatch(off())
        router.replace('/');
      }
    });
    }, []);

  // useEffect(()=>{
  //   console.log('user',user)
  // },[user])
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-10 rounded-md shadow-md">
        <p className="text-center text-lg font-medium">Carregando...</p>
      </div>
    </div>
  );
  else return (
    <div>
      {user ? (
        <></>
      ) : (
        <div className="flex max-h-screen flex-col items-center justify-center ">
        <div className=" p-10 rounded-lg shadow-md w-96">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            {/* Formulário de login */}
            <form className="flex flex-col gap-4">
            <input 
                type="email" 
                placeholder="Email" 
                onChange={(e) => setEmail(e.target.value)} 
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring focus:ring-blue-500"
                style={{ "color": "black"}}
            />
            <input 
                type="password" 
                placeholder="Senha" 
                onChange={(e) => setPassword(e.target.value)} 
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring focus:ring-blue-500"
                style={{ "color": "black"}}
            />
            <button 
                type="submit" 
                onClick={(event) => {
                event.preventDefault(); // Impede o envio padrão do formulário
                // Faça login com o Firebase
                setLoading(true);
                signInWithEmailAndPassword(getAuth(auth), email, password)
                    .then((userCredential) => {
                    // Usuário logado com sucesso
                    setUser(userCredential.user);
                    // console.log('deu certo',userCredential.user)
                    dispatch(on())
                    setLoading(false);
                    router.replace('/init');
                    })
                    .catch((error) => {
                    // Erro ao fazer login
                    setLoading(false);
                    dispatch(off());
                    router.replace('/');
                    console.error(error);
                    });
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring focus:ring-blue-500"
            >Entrar</button>
            </form>
        </div>
        </div>
      )}
    </div>
  );
}

export default App;
