import * as React from 'react';
import styled from 'styled-components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../contexts/AuthContext';
import { Lock, User, CheckCircle, XCircle } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import Loader from '../components/Loader';
import logo from '../assets/BrandLogo.png';

export default function Authentication() {
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
        validationSchema: formState === 0 ? loginSchema : registerSchema,
        onSubmit: async (values) => {
            if (isLoading || isGoogleLoading) return;

            setIsLoading(true);
            setError("");

            try {
                if (formState === 0) { // Login
                    await handleLogin(values.username, values.password);
                }
                if (formState === 1) { // Register
                    let result = await handleRegister(values.name, values.username, values.password);
                    setMessage(result);
                    setOpen(true);
                    setError("");
                    setFormState(0);
                    formik.resetForm();
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
                        <div className="flex justify-center mb-6">
                            <img
                                src={logo}
                                alt="Logo"
                                className="h-20 w-auto object-contain"
                            />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            {formState === 0 ? "Welcome back" : "Create account"}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            {formState === 0 ? "New to Cenfora? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => setFormState(formState === 0 ? 1 : 0)}
                                className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors underline-offset-4 hover:underline cursor-pointer"
                            >
                                {formState === 0 ? "Create an account" : "Sign in"}
                            </button>
                        </p>
                    </div>

                    <div className="space-y-6 mt-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-2xl shadow-indigo-100/50">

                        <form onSubmit={formik.handleSubmit} className="space-y-4">

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
                                            className={`block w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${formik.touched.name && formik.errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'}`}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    {formik.touched.name && formik.errors.name && (
                                        <p className="mt-1 text-xs text-red-500 font-medium ml-1">{formik.errors.name}</p>
                                    )}
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
                                        {...formik.getFieldProps('username')}
                                        className={`block w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${formik.touched.username && formik.errors.username ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'}`}
                                        placeholder="johndoe123"
                                    />
                                </div>
                                {formik.touched.username && formik.errors.username && (
                                    <p className="mt-1 text-xs text-red-500 font-medium ml-1">{formik.errors.username}</p>
                                )}
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
                                        {...formik.getFieldProps('password')}
                                        className={`block w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${formik.touched.password && formik.errors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'}`}
                                        placeholder="••••••••"
                                    />
                                </div>
                                {formik.touched.password && formik.errors.password && (
                                    <p className="mt-1 text-xs text-red-500 font-medium ml-1">{formik.errors.password}</p>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                                    <XCircle className="w-4 h-4" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            <StyledWrapper>
                                <button
                                    className="button"
                                    type="submit"
                                    disabled={isLoading || isGoogleLoading}
                                >
                                    {isLoading ? (
                                        <Loader color="#ffffff" />
                                    ) : (
                                        <>
                                            <span className="text">
                                                {formState === 0 ? "Sign In" : "Create Account"}
                                            </span>
                                            <span className="svg">
                                                <svg xmlns="http://www.w3.org/2000/svg" width={50} height={20} viewBox="0 0 38 15" fill="none">
                                                    <path fill="white" d="M10 7.519l-.939-.344h0l.939.344zm14.386-1.205l-.981-.192.981.192zm1.276 5.509l.537.843.148-.094.107-.139-.792-.611zm4.819-4.304l-.385-.923h0l.385.923zm7.227.707a1 1 0 0 0 0-1.414L31.343.448a1 1 0 0 0-1.414 0 1 1 0 0 0 0 1.414l5.657 5.657-5.657 5.657a1 1 0 0 0 1.414 1.414l6.364-6.364zM1 7.519l.554.833.029-.019.094-.061.361-.23 1.277-.77c1.054-.609 2.397-1.32 3.629-1.787.617-.234 1.17-.392 1.623-.455.477-.066.707-.008.788.034.025.013.031.021.039.034a.56.56 0 0 1 .058.235c.029.327-.047.906-.39 1.842l1.878.689c.383-1.044.571-1.949.505-2.705-.072-.815-.45-1.493-1.16-1.865-.627-.329-1.358-.332-1.993-.244-.659.092-1.367.305-2.056.566-1.381.523-2.833 1.297-3.921 1.925l-1.341.808-.385.245-.104.068-.028.018c-.011.007-.011.007.543.84zm8.061-.344c-.198.54-.328 1.038-.36 1.484-.032.441.024.94.325 1.364.319.45.786.64 1.21.697.403.054.824-.001 1.21-.09.775-.179 1.694-.566 2.633-1.014l3.023-1.554c2.115-1.122 4.107-2.168 5.476-2.524.329-.086.573-.117.742-.115s.195.038.161.014c-.15-.105.085-.139-.076.685l1.963.384c.192-.98.152-2.083-.74-2.707-.405-.283-.868-.37-1.28-.376s-.849.069-1.274.179c-1.65.43-3.888 1.621-5.909 2.693l-2.948 1.517c-.92.439-1.673.743-2.221.87-.276.064-.429.065-.492.057-.043-.006.066.003.155.127.07.099.024.131.038-.063.014-.187.078-.49.243-.94l-1.878-.689zm14.343-1.053c-.361 1.844-.474 3.185-.413 4.161.059.95.294 1.72.811 2.215.567.544 1.242.546 1.664.459a2.34 2.34 0 0 0 .502-.167l.15-.076.049-.028.018-.011c.013-.008.013-.008-.524-.852l-.536-.844.019-.012c-.038.018-.064.027-.084.032-.037.008.053-.013.125.056.021.02-.151-.135-.198-.895-.046-.734.034-1.887.38-3.652l-1.963-.384zm2.257 5.701l.791.611.024-.031.08-.101.311-.377 1.093-1.213c.922-.954 2.005-1.894 2.904-2.27l-.771-1.846c-1.31.547-2.637 1.758-3.572 2.725l-1.184 1.314-.341.414-.093.117-.025.032c-.01.013-.01.013.781.624zm5.204-3.381c.989-.413 1.791-.42 2.697-.307.871.108 2.083.385 3.437.385v-2c-1.197 0-2.041-.226-3.19-.369-1.114-.139-2.297-.146-3.715.447l.771 1.846z" />
                                                </svg>
                                            </span>
                                        </>
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

                        <button
                            type="button"
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

// Updated styled-components based on your new design
const StyledWrapper = styled.div`
  .button {
    width: 100%; /* Force full width to match form */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 32px;
    background-color: #006aff;
    border: 8px solid #c0dfff;
    color: white;
    gap: 8px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s;
    /* Ensure height remains consistent during loading */
    min-height: 80px; 
  }
  
  .button:disabled {
    cursor: not-allowed;
    opacity: 0.9;
    border-color: #e2e8f0;
  }

  .text {
    font-size: 1.2em; /* Adjusted slightly for form fit */
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .svg {
    padding-top: 5px;
    height: 100%;
    width: fit-content;
  }

  .svg svg {
    width: 30px; /* Scaled down slightly to fit form button better */
    height: 20px;
  }

  .button:hover:not(:disabled) {
    border: 8px solid #b1d8ff;
    background-color: #1b7aff;
  }

  .button:active:not(:disabled) {
    border: 5px solid #c0dfff;
  }

  .button:hover:not(:disabled) .svg svg {
    animation: jello-vertical 0.9s both;
    transform-origin: left;
  }

  @keyframes jello-vertical {
    0% { transform: scale3d(1, 1, 1); }
    30% { transform: scale3d(0.75, 1.25, 1); }
    40% { transform: scale3d(1.25, 0.75, 1); }
    50% { transform: scale3d(0.85, 1.15, 1); }
    65% { transform: scale3d(1.05, 0.95, 1); }
    75% { transform: scale3d(0.95, 1.05, 1); }
    100% { transform: scale3d(1, 1, 1); }
  }
`;