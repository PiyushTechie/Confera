import * as React from 'react';
import styled from 'styled-components'; 
import { AuthContext } from '../contexts/AuthContext';
import { Lock, User, CheckCircle, XCircle } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import Loader from './Loader'; // Ensure this path is correct

export default function Authentication() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");

    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    
    // Loading state
    const [isLoading, setIsLoading] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    React.useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                setOpen(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [open]);

    let handleAuth = async () => {
        if (isLoading) return; // Prevent double clicks
        
        setIsLoading(true);
        setError("");

        try {
            if (formState === 0) { // Login
                await handleLogin(username, password);
            }
            if (formState === 1) { // Register
                let result = await handleRegister(name, username, password);
                setMessage(result);
                setOpen(true);
                setError("");
                setFormState(0);
                setUsername("");
                setPassword("");
            }
        } catch (err) {
            console.log(err);
            let message = err.response?.data?.message || "An unexpected error occurred";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen flex bg-white text-slate-900 font-sans selection:bg-indigo-100">
            
            <div className="hidden lg:flex w-2/3 relative items-center justify-center overflow-hidden">
                 <div className="absolute inset-0 bg-indigo-900/40 z-10" />
                 <img 
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
                    alt="Background" 
                    className="absolute inset-0 w-full h-full object-cover"
                 />
                 <div className="relative z-20 p-12 text-center">
                     <h2 className="text-5xl font-bold mb-6 text-white drop-shadow-xl">Welcome to Cenfora</h2>
                     <p className="text-xl text-indigo-50 max-w-lg mx-auto drop-shadow-md font-medium">
                         Secure, high-quality video conferencing for everyone, everywhere.
                     </p>
                 </div>
            </div>

            <div className="w-full lg:w-1/3 flex items-center justify-center p-8 relative bg-white">
                
                {open && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:left-6 lg:translate-x-0 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-3 rounded-xl flex items-center gap-3 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                <div className="w-full max-w-md space-y-8">
                    
                    <div className="text-center">
                        <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/20">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            {formState === 0 ? "Welcome back" : "Create account"}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            {formState === 0 ? "New to Cenfora? " : "Already have an account? "}
                            <button 
                                onClick={() => { setFormState(formState === 0 ? 1 : 0); setError(""); }}
                                className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors underline-offset-4 hover:underline"
                            >
                                {formState === 0 ? "Create an account" : "Sign in"}
                            </button>
                        </p>
                    </div>

                    <div className="space-y-6 mt-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-2xl shadow-indigo-100/50">
                        
                        <div className="space-y-4">
                            {formState === 1 && (
                                <div>
                                    <label htmlFor="fullname" className="block text-sm font-bold text-slate-700 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="fullname"
                                            name="name"
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="username" className="block text-sm font-bold text-slate-700 mb-1">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                                        placeholder="johndoe123"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                                <XCircle className="w-4 h-4" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <StyledWrapper>
                            <button onClick={handleAuth} disabled={isLoading}>
                                {isLoading ? (
                                    <Loader />
                                ) : (
                                    formState === 0 ? "Sign In" : "Create Account"
                                )}
                            </button>
                        </StyledWrapper>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-400 font-semibold tracking-wide">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center gap-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <FcGoogle className="text-xl" />
                            <span>
                                {formState === 0 ? "Sign in with Google" : "Sign up with Google"}
                            </span>
                        </button>
                    </div>          
                </div>
            </div>
        </div>
    );
}

const StyledWrapper = styled.div`
  button {
    width: 100%;
    /* Fixed height helps prevent jumping when content switches to loader */
    height: 54px; 
    padding: 0 25px;
    display: flex; /* Helps center the loader */
    align-items: center;
    justify-content: center;
    
    border: unset;
    border-radius: 12px;
    color: #ffffff;
    z-index: 1;
    background: #4f46e5; /* Indigo-600 */
    position: relative;
    font-weight: 700;
    font-size: 16px;
    box-shadow: 0px 4px 14px rgba(79, 70, 229, 0.4);
    transition: all 250ms;
    overflow: hidden;
    cursor: pointer;
  }
  
  /* Disable pointer events when loading */
  button:disabled {
    cursor: not-allowed;
    opacity: 0.9;
  }

  button::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 0;
    border-radius: 12px;
    background-color: #4338ca; /* Indigo-700 Hover Fill */
    z-index: -1;
    transition: all 250ms;
  }

  button:hover:not(:disabled) {
    color: #ffffff;
    box-shadow: 0px 6px 20px rgba(79, 70, 229, 0.6);
    transform: translateY(-1px);
  }

  button:hover:not(:disabled)::before {
    width: 100%;
  }

  button:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: 0px 2px 10px rgba(79, 70, 229, 0.3);
  }
`;