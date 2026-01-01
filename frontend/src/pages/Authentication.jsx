import * as React from 'react';
import styled from 'styled-components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../contexts/AuthContext';
import { Lock, User, CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";
import Loader from '../components/Loader';
import logo from '../assets/BrandLogo.png';
import { sendOtp, verifyOtp, resendOtp, forgotPassword, resetPassword } from '../services/authApi';

// --- CUSTOM OTP COMPONENT ---
const OtpInput = ({ formik, length = 6 }) => {
    const inputRefs = React.useRef([]);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return; // Only numbers allowed

        const currentOtp = formik.values.otp.split('');
        
        // Handle last character entered (in case user types fast)
        const lastChar = value.substring(value.length - 1);
        currentOtp[index] = lastChar;
        
        const newOtp = currentOtp.join('');
        formik.setFieldValue('otp', newOtp);

        // Move focus to next box
        if (lastChar && index < length - 1 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !formik.values.otp[index] && index > 0 && inputRefs.current[index - 1]) {
            // Move focus back if empty
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, length).replace(/[^0-9]/g, ''); // Clean non-numbers
        formik.setFieldValue('otp', data);
        if (inputRefs.current[length - 1]) inputRefs.current[length - 1].focus();
    };

    return (
        <div className="flex gap-2 justify-center w-full my-4">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={formik.values.otp[index] || ''}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none transition-all
                        ${formik.values.otp[index] 
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                            : 'border-slate-300 bg-white text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                        }
                        ${formik.errors.otp && formik.touched.otp ? 'border-red-500 bg-red-50' : ''}
                    `}
                />
            ))}
        </div>
    );
};

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
        username: Yup.string().required("Required"),
        password: Yup.string().required("Required"),
    });

    const registerSchema = Yup.object().shape({
        name: Yup.string().required("Required"),
        username: Yup.string().required("Required"),
        email: Yup.string().email("Invalid email").required("Required"),
        password: Yup.string().min(6, "Min 6 chars").required("Required"),
    });

    const otpSchema = Yup.object().shape({
        otp: Yup.string().length(6, "Enter 6 digits").required("Required"),
    });

    const forgotSchema = Yup.object().shape({
        email: Yup.string().email("Invalid email").required("Required"),
    });

    const resetSchema = Yup.object().shape({
        otp: Yup.string().length(6, "Enter 6 digits").required("Required"),
        newPassword: Yup.string().min(6, "Min 6 chars").required("Required"),
    });

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
                if (formState === 0) await handleLogin(values.username, values.password);
                
                if (formState === 1) { 
                    await handleRegister(values.name, values.username, values.password, values.email);
                    await sendOtp(values.email);
                    setMessage("OTP sent!");
                    setOpen(true);
                    setFormState(2);
                }

                if (formState === 2) {
                    await verifyOtp(values.email, values.otp);
                    setMessage("Verified! Login now.");
                    setOpen(true);
                    setFormState(0);
                    formik.resetForm();
                }

                if (formState === 3) {
                    await forgotPassword(values.email);
                    setMessage(`OTP sent to ${values.email}`);
                    setOpen(true);
                    setFormState(4);
                }

                if (formState === 4) {
                    await resetPassword(values.email, values.otp, values.newPassword);
                    setMessage("Password Reset!");
                    setOpen(true);
                    setFormState(0);
                    formik.resetForm();
                }

            } catch (err) {
                console.log(err);
                let msg = err.response?.data?.message || err.message || "Error occurred";
                setError(msg);
            } finally {
                setIsLoading(false);
            }
        },
    });

    // Reset errors when switching states
    React.useEffect(() => {
        formik.setErrors({});
        setError("");
        if(formState !== 2 && formState !== 4) formik.setFieldValue('otp', '');
    }, [formState]);

    React.useEffect(() => {
        if (open) {
            const timer = setTimeout(() => setOpen(false), 3000);
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
            setError("Failed to resend");
        }
    }

    const getTitle = () => {
        if (formState === 0) return "Welcome Back";
        if (formState === 1) return "Create Account";
        if (formState === 2) return "Verify OTP";
        if (formState === 3) return "Forgot Password";
        if (formState === 4) return "Reset Password";
    };

    const getButtonText = () => {
        if (formState === 0) return "Sign In";
        if (formState === 1) return "Sign Up";
        if (formState === 2) return "Verify";
        if (formState === 3) return "Send OTP";
        if (formState === 4) return "Reset";
    };

    return (
        <div className="h-screen flex bg-white text-slate-900 font-sans overflow-hidden">
            {/* Background Image Section - Unchanged but ensured full height */}
            <div className="hidden lg:flex w-2/3 relative items-center justify-center overflow-hidden h-full">
                <div className="absolute inset-0 bg-indigo-900/40 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="relative z-20 p-12 text-center">
                    <h2 className="text-4xl font-bold mb-4 text-white drop-shadow-xl">Welcome to Cenfora</h2>
                    <p className="text-lg text-indigo-50 max-w-lg mx-auto drop-shadow-md font-medium">
                        Secure, high-quality video conferencing.
                    </p>
                </div>
            </div>

            {/* Form Section - TIGHTLY PACKED */}
            <div className="w-full lg:w-1/3 flex flex-col items-center justify-center p-6 h-full relative bg-white overflow-y-auto">
                
                {/* Notification */}
                {open && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                <div className="w-full max-w-[380px] flex flex-col justify-center">

                    <div className="text-center mb-6">
                        <img src={logo} alt="Logo" className="h-16 w-auto object-contain mx-auto mb-4" />
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {getTitle()}
                        </h2>
                        
                        <div className="mt-1 text-sm text-slate-500">
                            {formState === 0 && (
                                <>New here? <button onClick={() => setFormState(1)} className="font-bold text-indigo-600 hover:underline">Create account</button></>
                            )}
                            {formState === 1 && (
                                <>Have an account? <button onClick={() => setFormState(0)} className="font-bold text-indigo-600 hover:underline">Sign in</button></>
                            )}
                            {(formState === 2 || formState === 4) && <span>Code sent to <b>{formik.values.email}</b></span>}
                        </div>
                    </div>

                    <form onSubmit={formik.handleSubmit} className="space-y-4">
                        
                        {/* --- REGISTER FIELDS --- */}
                        {formState === 1 && (
                            <div className="space-y-3">
                                <InputField id="name" label="Full Name" icon={<User size={18}/>} placeholder="John Doe" formik={formik} />
                                <InputField id="username" label="Username" icon={<User size={18}/>} placeholder="johndoe" formik={formik} />
                                <InputField id="email" label="Email" icon={<Mail size={18}/>} placeholder="john@example.com" formik={formik} />
                            </div>
                        )}

                        {/* --- LOGIN FIELDS --- */}
                        {formState === 0 && (
                            <InputField id="username" label="Username" icon={<User size={18}/>} placeholder="johndoe" formik={formik} />
                        )}

                        {/* --- PASSWORD --- */}
                        {(formState === 0 || formState === 1) && (
                            <InputField id="password" type="password" label="Password" icon={<Lock size={18}/>} placeholder="••••••" formik={formik} />
                        )}

                        {/* --- OTP 6-BOX INPUT --- */}
                        {(formState === 2 || formState === 4) && (
                           <div className="text-center">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Enter 6-digit OTP</label>
                                <OtpInput formik={formik} />
                           </div>
                        )}

                        {/* --- FORGOT --- */}
                        {formState === 3 && (
                            <InputField id="email" label="Email Address" icon={<Mail size={18}/>} placeholder="john@example.com" formik={formik} />
                        )}

                        {/* --- RESET PASS --- */}
                        {formState === 4 && (
                            <InputField id="newPassword" type="password" label="New Password" icon={<Lock size={18}/>} placeholder="New secure password" formik={formik} />
                        )}

                        {/* --- LINKS --- */}
                        <div className="flex justify-between items-center text-xs font-semibold">
                            {formState === 0 && (
                                <button type="button" onClick={() => setFormState(3)} className="text-indigo-600 hover:text-indigo-500 ml-auto">
                                    Forgot password?
                                </button>
                            )}
                            {(formState === 2 || formState === 4) && (
                                <button type="button" onClick={handleResendClick} className="text-indigo-600 hover:text-indigo-500 ml-auto">
                                    Resend Code
                                </button>
                            )}
                        </div>

                        {/* --- ERROR --- */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200">
                                <XCircle className="w-4 h-4" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {/* --- SUBMIT --- */}
                        <StyledWrapper>
                            <button className="button" type="submit" disabled={isLoading || isGoogleLoading}>
                                {isLoading ? <Loader color="#ffffff" size={20} /> : <span className="text">{getButtonText()}</span>}
                            </button>
                        </StyledWrapper>

                        {/* --- BACK BUTTON --- */}
                        {(formState > 1) && (
                            <button 
                                type="button" 
                                onClick={() => { setFormState(0); formik.resetForm(); }}
                                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 text-sm mt-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Login
                            </button>
                        )}
                    </form>

                    {/* --- GOOGLE --- */}
                    {(formState === 0 || formState === 1) && (
                        <div className="mt-4">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">Or continue with</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isLoading || isGoogleLoading}
                                className="w-full h-12 flex items-center justify-center gap-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all text-sm font-bold"
                            >
                                {isGoogleLoading ? <Loader color="#4f46e5" size={20}/> : (
                                    <>
                                        <FcGoogle className="text-lg" />
                                        <span>{formState === 0 ? "Sign in with Google" : "Sign up with Google"}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Compact Input Field
const InputField = ({ id, label, icon, type = "text", placeholder, formik }) => (
    <div>
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                {icon}
            </div>
            <input
                id={id}
                name={id}
                type={type}
                {...formik.getFieldProps(id)}
                className={`block w-full pl-10 pr-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${formik.touched[id] && formik.errors[id] ? 'border-red-500 focus:ring-red-200' : 'border-slate-200'}`}
                placeholder={placeholder}
            />
        </div>
        {formik.touched[id] && formik.errors[id] && (
            <p className="mt-0.5 text-[10px] text-red-500 font-bold">{formik.errors[id]}</p>
        )}
    </div>
);

const StyledWrapper = styled.div`
  .button {
    width: 100%;
    height: 48px; 
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #4f46e5;
    border: 4px solid #c7d2fe; 
    color: white;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .button:disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }
  .text {
    font-size: 0.95em;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .button:hover:not(:disabled) {
    background-color: #4338ca;
    border-color: #a5b4fc; 
  }
  .button:active:not(:disabled) {
    border-width: 2px;
    transform: scale(0.99);
  }
`;