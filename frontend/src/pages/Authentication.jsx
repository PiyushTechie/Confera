import * as React from 'react';
import styled from 'styled-components'; 
import { useFormik } from 'formik'; // Import Formik
import * as Yup from 'yup'; // Import Yup
import { AuthContext } from '../contexts/AuthContext';
import { Lock, User, CheckCircle, XCircle } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import Loader from '../components/Loader';
import logo from '../assets/BrandLogo.png';

export default function Authentication() {
    // Note: We removed the individual state variables for inputs because Formik handles them now.
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0); // 0 = Login, 1 = Register
    const [open, setOpen] = React.useState(false);
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    // --- Validation Schemas ---
    const loginSchema = Yup.object().shape({
        username: Yup.string().required("Username is required"),
        password: Yup.string().required("Password is required"),
    });

    const registerSchema = Yup.object().shape({
        name: Yup.string().required("Full name is required"),
        username: Yup.string().required("Username is required"),
        password: Yup.string()
            .min(6, "Password must be at least 6 characters")
            .required("Password is required"),
    });

    // --- Formik Setup ---
    const formik = useFormik({
        initialValues: {
            name: "",
            username: "",
            password: "",
        },
        // Dynamically switch schema based on formState
        validationSchema: formState === 0 ? loginSchema : registerSchema,
        onSubmit: async (values) => {
            if (isLoading || isGoogleLoading) return;
            
            setIsLoading(true);
            setError("");

            try {
                if (formState === 0) { // Login logic
                    await handleLogin(values.username, values.password);
                }
                if (formState === 1) { // Register logic
                    let result = await handleRegister(values.name, values.username, values.password);
                    setMessage(result);
                    setOpen(true);
                    setError("");
                    setFormState(0); // Switch to login after success
                    formik.resetForm(); // Clear form
                }
            } catch (err) {
                console.log(err);
                let message = err.response?.data?.message || "An unexpected error occurred";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        },
    });

    // Reset form and errors when switching between Login/Register
    React.useEffect(() => {
        formik.resetForm();
        setError("");
    }, [formState]);

    React.useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                setOpen(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleGoogleLogin = () => {
        if (isLoading || isGoogleLoading) return;

        setIsGoogleLoading(true);
        setTimeout(() => {
             window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
        }, 100);
    };

    return (
        <div className="min-h-screen flex bg-white text-slate-900 font-sans selection:bg-indigo-100">
            
            {/* Left Side (Background) */}
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

            {/* Right Side (Form) */}
            <div className="w-full lg:w-1/3 flex items-center justify-center p-8 relative bg-white">
                
                {/* Success Toast */}
                {open && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:left-6 lg:translate-x-0 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-3 rounded-xl flex items-center gap-3 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                <div className="w-full max-w-md space-y-8">
                    
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <img 
                                src={logo} 
                                alt="Logo" 
                                // UPDATED: Changed h-12 to h-24 for larger view
                                className="h-24 w-auto object-contain" 
                            />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            {formState === 0 ? "Welcome back" : "Create account"}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            {formState === 0 ? "New to Cenfora? " : "Already have an account? "}
                            <button 
                                type="button" // Important so it doesn't submit form
                                onClick={() => setFormState(formState === 0 ? 1 : 0)}
                                className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors underline-offset-4 hover:underline cursor-pointer"
                            >
                                {formState === 0 ? "Create an account" : "Sign in"}
                            </button>
                        </p>
                    </div>

                    <div className="space-y-6 mt-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-2xl shadow-indigo-100/50">
                        
                        {/* WRAPPED IN FORM TAG FOR FORMIK */}
                        <form onSubmit={formik.handleSubmit} className="space-y-4">
                            
                            {/* Full Name Field (Register Only) */}
                            {formState === 1 && (
                                <div>
                                    <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            {...formik.getFieldProps('name')}
                                            className={`block w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${
                                                formik.touched.name && formik.errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'
                                            }`}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    {formik.touched.name && formik.errors.name && (
                                        <p className="mt-1 text-xs text-red-500 font-medium ml-1">{formik.errors.name}</p>
                                    )}
                                </div>
                            )}

                            {/* Username Field */}
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
                                        {...formik.getFieldProps('username')}
                                        className={`block w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${
                                            formik.touched.username && formik.errors.username ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'
                                        }`}
                                        placeholder="johndoe123"
                                    />
                                </div>
                                {formik.touched.username && formik.errors.username && (
                                    <p className="mt-1 text-xs text-red-500 font-medium ml-1">{formik.errors.username}</p>
                                )}
                            </div>

                            {/* Password Field */}
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
                                        {...formik.getFieldProps('password')}
                                        className={`block w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${
                                            formik.touched.password && formik.errors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'
                                        }`}
                                        placeholder="••••••••"
                                    />
                                </div>
                                {formik.touched.password && formik.errors.password && (
                                    <p className="mt-1 text-xs text-red-500 font-medium ml-1">{formik.errors.password}</p>
                                )}
                            </div>

                            {/* Backend Error Display */}
                            {error && (
                                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                                    <XCircle className="w-4 h-4" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <StyledWrapper>
                                <button 
                                    type="submit" // Triggers Formik onSubmit
                                    disabled={isLoading || isGoogleLoading}
                                >
                                    {isLoading ? (
                                        <Loader color="#ffffff" />
                                    ) : (
                                        formState === 0 ? "Sign In" : "Create Account"
                                    )}
                                </button>
                            </StyledWrapper>
                        </form>

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

                        {/* Google Button */}
                        <button
                            type="button" // Prevent form submission
                            onClick={handleGoogleLogin}
                            disabled={isLoading || isGoogleLoading}
                            className={`w-full h-[54px] flex items-center cursor-pointer justify-center gap-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all font-semibold rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] ${
                                (isLoading || isGoogleLoading) ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                        >
                            {isGoogleLoading ? (
                                <Loader color="#4f46e5" /> 
                            ) : (
                                <>
                                    <FcGoogle className="text-xl" />
                                    <span>
                                        {formState === 0 ? "Sign in with Google" : "Sign up with Google"}
                                    </span>
                                </>
                            )}
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
    height: 54px; 
    padding: 0 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    border: unset;
    border-radius: 12px;
    color: #ffffff;
    z-index: 1;
    background: #4f46e5;
    position: relative;
    font-weight: 700;
    font-size: 16px;
    box-shadow: 0px 4px 14px rgba(79, 70, 229, 0.4);
    transition: all 250ms;
    overflow: hidden;
    cursor: pointer;
  }
  
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
    background-color: #4338ca;
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