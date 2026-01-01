import * as React from 'react';
import styled from 'styled-components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../contexts/AuthContext';
import { Lock, User, CheckCircle, XCircle, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import Loader from '../components/Loader';
import logo from '../assets/BrandLogo.png';
import { sendOtp, verifyOtp, resendOtp, forgotPassword, resetPassword } from '../services/authApi'; // Import your API calls

export default function Authentication() {
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    
    // 0: Login, 1: Register, 2: OTP Verify, 3: Forgot Pass, 4: Reset Pass
    const [formState, setFormState] = React.useState(0); 
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
        email: Yup.string().email("Invalid email").required("Email is required for verification"),
        password: Yup.string().min(6, "Min 6 characters").required("Password is required"),
    });

    const otpSchema = Yup.object().shape({
        otp: Yup.string().length(6, "Must be 6 digits").required("OTP is required"),
    });

    const forgotSchema = Yup.object().shape({
        email: Yup.string().email("Invalid email").required("Email is required"),
    });

    const resetSchema = Yup.object().shape({
        otp: Yup.string().length(6, "Must be 6 digits").required("OTP is required"),
        newPassword: Yup.string().min(6, "Min 6 characters").required("New Password is required"),
    });

    // Helper to pick schema
    const getSchema = () => {
        switch(formState) {
            case 0: return loginSchema;
            case 1: return registerSchema;
            case 2: return otpSchema;
            case 3: return forgotSchema;
            case 4: return resetSchema;
            default: return loginSchema;
        }
    };

    // --- Formik Setup ---
    const formik = useFormik({
        initialValues: {
            name: "",
            username: "",
            email: "",
            password: "",
            otp: "",
            newPassword: ""
        },
        validationSchema: getSchema(),
        onSubmit: async (values) => {
            if (isLoading) return;
            setIsLoading(true);
            setError("");
            setMessage("");

            try {
                // --- LOGIN FLOW ---
                if (formState === 0) { 
                    await handleLogin(values.username, values.password);
                }

                // --- REGISTER FLOW ---
                if (formState === 1) { 
                    // 1. Create User in DB
                    await handleRegister(values.name, values.username, values.password, values.email);
                    // 2. Send OTP
                    await sendOtp(values.email);
                    
                    setMessage("Account created. OTP sent to email!");
                    setOpen(true);
                    setFormState(2); // Move to OTP Verification
                }

                // --- OTP VERIFICATION FLOW ---
                if (formState === 2) {
                    await verifyOtp(values.email, values.otp);
                    setMessage("Email Verified! Please Login.");
                    setOpen(true);
                    setFormState(0); // Move to Login
                    formik.resetForm();
                }

                // --- FORGOT PASSWORD FLOW ---
                if (formState === 3) {
                    await forgotPassword(values.email);
                    setMessage(`OTP sent to ${values.email}`);
                    setOpen(true);
                    setFormState(4); // Move to Reset Password
                }

                // --- RESET PASSWORD FLOW ---
                if (formState === 4) {
                    await resetPassword(values.email, values.otp, values.newPassword);
                    setMessage("Password Reset Successfully!");
                    setOpen(true);
                    setFormState(0); // Move to Login
                    formik.resetForm();
                }

            } catch (err) {
                console.log(err);
                let msg = err.response?.data?.message || err.message || "An unexpected error occurred";
                setError(msg);
            } finally {
                setIsLoading(false);
            }
        },
    });

    // Reset form errors when switching states
    React.useEffect(() => {
        formik.setErrors({});
        setError("");
    }, [formState]);

    React.useEffect(() => {
        if (open) {
            const timer = setTimeout(() => setOpen(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleGoogleLogin = () => {
        if (isLoading || isGoogleLoading) return;
        setIsGoogleLoading(true);
        window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
    };

    const handleResendClick = async () => {
        if(!formik.values.email) return setError("Email is missing");
        try {
            await resendOtp(formik.values.email);
            setMessage("OTP Resent!");
            setOpen(true);
        } catch (e) {
            setError("Failed to resend OTP");
        }
    }

    // --- Dynamic Text Helpers ---
    const getTitle = () => {
        if (formState === 0) return "Welcome back";
        if (formState === 1) return "Create account";
        if (formState === 2) return "Verify Email";
        if (formState === 3) return "Forgot Password";
        if (formState === 4) return "Reset Password";
    };

    const getButtonText = () => {
        if (formState === 0) return "Sign In";
        if (formState === 1) return "Sign Up";
        if (formState === 2) return "Verify OTP";
        if (formState === 3) return "Send Code";
        if (formState === 4) return "Reset Password";
    };

    return (
        <div className="min-h-screen flex bg-white text-slate-900 font-sans selection:bg-indigo-100">
            {/* Background Image Section (Unchanged) */}
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

            {/* Form Section */}
            <div className="w-full lg:w-1/3 flex items-center justify-center p-8 relative bg-white">
                
                {/* Success Notification */}
                {open && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 lg:left-6 lg:translate-x-0 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-3 rounded-xl flex items-center gap-3 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                <div className="w-full max-w-md space-y-8">

                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            {getTitle()}
                        </h2>
                        
                        {/* Subtext Logic */}
                        <p className="mt-2 text-sm text-slate-500">
                            {formState === 0 && (
                                <>
                                    New to Cenfora? 
                                    <button onClick={() => setFormState(1)} className="ml-1 font-bold text-indigo-600 hover:underline">
                                        Create an account
                                    </button>
                                </>
                            )}
                            {formState === 1 && (
                                <>
                                    Already have an account? 
                                    <button onClick={() => setFormState(0)} className="ml-1 font-bold text-indigo-600 hover:underline">
                                        Sign in
                                    </button>
                                </>
                            )}
                            {(formState === 2 || formState === 4) && (
                                <span>Check your email <b>{formik.values.email}</b> for the code.</span>
                            )}
                            {formState === 3 && "Enter your email to receive a reset code."}
                        </p>
                    </div>

                    <div className="space-y-6 mt-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-2xl shadow-indigo-100/50">

                        <form onSubmit={formik.handleSubmit} className="space-y-4">

                            {/* --- REGISTER FIELDS --- */}
                            {formState === 1 && (
                                <>
                                    <InputField 
                                        id="name" 
                                        label="Full Name" 
                                        icon={<User className="h-5 w-5 text-slate-400" />} 
                                        placeholder="John Doe" 
                                        formik={formik} 
                                    />
                                    <InputField 
                                        id="username" 
                                        label="Username" 
                                        icon={<User className="h-5 w-5 text-slate-400" />} 
                                        placeholder="johndoe123" 
                                        formik={formik} 
                                    />
                                    <InputField 
                                        id="email" 
                                        label="Email Address" 
                                        icon={<Mail className="h-5 w-5 text-slate-400" />} 
                                        placeholder="john@example.com" 
                                        formik={formik} 
                                    />
                                </>
                            )}

                            {/* --- LOGIN FIELDS --- */}
                            {formState === 0 && (
                                <InputField 
                                    id="username" 
                                    label="Username" 
                                    icon={<User className="h-5 w-5 text-slate-400" />} 
                                    placeholder="johndoe123" 
                                    formik={formik} 
                                />
                            )}

                            {/* --- SHARED PASSWORD FIELD (Login & Register) --- */}
                            {(formState === 0 || formState === 1) && (
                                <InputField 
                                    id="password" 
                                    type="password"
                                    label="Password" 
                                    icon={<Lock className="h-5 w-5 text-slate-400" />} 
                                    placeholder="••••••••" 
                                    formik={formik} 
                                />
                            )}

                            {/* --- OTP FIELD (Verify & Reset) --- */}
                            {(formState === 2 || formState === 4) && (
                                <div className="text-center">
                                    <InputField 
                                        id="otp" 
                                        label="Verification Code" 
                                        icon={<KeyRound className="h-5 w-5 text-slate-400" />} 
                                        placeholder="123456" 
                                        formik={formik}
                                        className="tracking-[10px] text-center font-bold text-xl"
                                    />
                                </div>
                            )}

                            {/* --- FORGOT PASSWORD FIELD --- */}
                            {formState === 3 && (
                                <InputField 
                                    id="email" 
                                    label="Email Address" 
                                    icon={<Mail className="h-5 w-5 text-slate-400" />} 
                                    placeholder="john@example.com" 
                                    formik={formik} 
                                />
                            )}

                            {/* --- NEW PASSWORD FIELD (Reset) --- */}
                            {formState === 4 && (
                                <InputField 
                                    id="newPassword" 
                                    type="password"
                                    label="New Password" 
                                    icon={<Lock className="h-5 w-5 text-slate-400" />} 
                                    placeholder="New secure password" 
                                    formik={formik} 
                                />
                            )}

                            {/* --- EXTRAS: Forgot Link & Resend --- */}
                            <div className="flex justify-between items-center text-sm">
                                {formState === 0 && (
                                    <button type="button" onClick={() => setFormState(3)} className="text-indigo-600 hover:text-indigo-500 font-semibold ml-auto">
                                        Forgot password?
                                    </button>
                                )}
                                {(formState === 2 || formState === 4) && (
                                    <button type="button" onClick={handleResendClick} className="text-indigo-600 hover:text-indigo-500 font-semibold ml-auto">
                                        Resend Code
                                    </button>
                                )}
                            </div>

                            {/* --- ERROR MESSAGE --- */}
                            {error && (
                                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                                    <XCircle className="w-4 h-4" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            {/* --- SUBMIT BUTTON --- */}
                            <StyledWrapper>
                                <button className="button" type="submit" disabled={isLoading || isGoogleLoading}>
                                    {isLoading ? (
                                        <Loader color="#ffffff" />
                                    ) : (
                                        <span className="text">{getButtonText()}</span>
                                    )}
                                </button>
                            </StyledWrapper>

                            {/* --- BACK TO LOGIN (For nested states) --- */}
                            {(formState > 1) && (
                                <button 
                                    type="button" 
                                    onClick={() => { setFormState(0); formik.resetForm(); }}
                                    className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mt-4"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Login
                                </button>
                            )}

                        </form>

                        {/* --- GOOGLE LOGIN (Only show on Login/Register) --- */}
                        {(formState === 0 || formState === 1) && (
                            <>
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
                                    className={`w-full h-[56px] flex items-center cursor-pointer justify-center gap-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all font-semibold rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] ${
                                        (isLoading || isGoogleLoading) ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isGoogleLoading ? <Loader color="#4f46e5" /> : (
                                        <>
                                            <FcGoogle className="text-xl" />
                                            <span>{formState === 0 ? "Sign in with Google" : "Sign up with Google"}</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Reusable Input Component to Clean up Code ---
const InputField = ({ id, label, icon, type = "text", placeholder, formik, className }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {icon}
            </div>
            <input
                id={id}
                name={id}
                type={type}
                {...formik.getFieldProps(id)}
                className={`block w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${formik.touched[id] && formik.errors[id] ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'} ${className}`}
                placeholder={placeholder}
            />
        </div>
        {formik.touched[id] && formik.errors[id] && (
            <p className="mt-1 text-xs text-red-500 font-medium ml-1">{formik.errors[id]}</p>
        )}
    </div>
);

// --- Styled Components (Unchanged from your request) ---
const StyledWrapper = styled.div`
  .button {
    width: 100%;
    height: 56px; 
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px; 
    background-color: #4f46e5;
    border: 5px solid #c7d2fe; 
    color: white;
    gap: 12px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s;
  }
  .button:disabled {
    cursor: not-allowed;
    opacity: 0.8;
    background-color: #6366f1;
    border-color: #e0e7ff;
  }
  .text {
    font-size: 1.1em;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .button:hover:not(:disabled) {
    background-color: #4338ca;
    border: 5px solid #a5b4fc; 
  }
  .button:active:not(:disabled) {
    border: 3px solid #c7d2fe;
    transform: scale(0.98);
  }
`;