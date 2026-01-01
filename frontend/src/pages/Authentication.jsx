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
        if (isNaN(value)) return;
        const currentOtp = formik.values.otp.split('');
        
        const lastChar = value.substring(value.length - 1);
        currentOtp[index] = lastChar;
        
        const newOtp = currentOtp.join('');
        formik.setFieldValue('otp', newOtp);

        if (lastChar && index < length - 1 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !formik.values.otp[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, length).replace(/[^0-9]/g, '');
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
    
    const [formState, setFormState] = React.useState(0); 
    const [open, setOpen] = React.useState(false);

    const [isLoading, setIsLoading] = React.useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    // --- Schemas ---
    const loginSchema = Yup.object({
        username: Yup.string().trim().required("Username cannot be empty"),
        password: Yup.string().required("Password is required"),
    });

    const registerSchema = Yup.object({
        name: Yup.string().trim().required("Full name is required"),
        username: Yup.string().trim().min(3, "Min 3 chars").required("Username is required"),
        email: Yup.string().email("Invalid email").required("Email is required"),
        password: Yup.string().min(6, "Min 6 chars").required("Password is required"),
    });

    const otpSchema = Yup.object({
        otp: Yup.string().matches(/^\d{6}$/, "Must be 6 digits").required("OTP is required"),
    });

    const forgotSchema = Yup.object({
        email: Yup.string().email("Invalid email").required("Email is required"),
    });

    const resetSchema = Yup.object({
        otp: Yup.string().matches(/^\d{6}$/, "Must be 6 digits").required("OTP is required"),
        newPassword: Yup.string().min(6, "Min 6 chars").required("New password is required"),
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
            {/* Background Image Section */}
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

            {/* Form Section */}
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
                                <>New here? <button onClick={() => setFormState(1)} className="font-bold text-indigo-600 hover:underline cursor-pointer">Create account</button></>
                            )}
                            {formState === 1 && (
                                <>Have an account? <button onClick={() => setFormState(0)} className="font-bold text-indigo-600 hover:underline cursor-pointer">Sign in</button></>
                            )}
                            {(formState === 2 || formState === 4) && <span>Code sent to <b>{formik.values.email}</b></span>}
                        </div>
                    </div>

                    <form onSubmit={formik.handleSubmit} className="space-y-4">
                        
                        {/* --- REGISTER FIELDS --- */}
                        {formState === 1 && (
                            <div className="space-y-3">
                                <InputField id="name" label="Full Name" icon={<User size={18}/>} placeholder="Enter your name " formik={formik} />
                                <InputField id="username" label="Username" icon={<User size={18}/>} placeholder="Enter your username" formik={formik} />
                                <InputField id="email" label="Email" icon={<Mail size={18}/>} placeholder="email@example.com" formik={formik} />
                            </div>
                        )}

                        {formState === 0 && (
                            <InputField id="username" label="Username" icon={<User size={18}/>} placeholder="johndoe" formik={formik} />
                        )}

                        {(formState === 0 || formState === 1) && (
                            <InputField id="password" type="password" label="Password" icon={<Lock size={18}/>} placeholder="Enter your passwords" formik={formik} />
                        )}

                        {(formState === 2 || formState === 4) && (
                           <div className="text-center">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Enter 6-digit OTP</label>
                                <OtpInput formik={formik} />
                           </div>
                        )}

                        {formState === 3 && (
                            <InputField id="email" label="Email Address" icon={<Mail size={18}/>} placeholder="john@example.com" formik={formik} />
                        )}

                        {formState === 4 && (
                            <InputField id="newPassword" type="password" label="New Password" icon={<Lock size={18}/>} placeholder="New secure password" formik={formik} />
                        )}

                        <div className="flex justify-between items-center text-xs font-semibold">
                            {formState === 0 && (
                                <button type="button" onClick={() => setFormState(3)} className="text-indigo-600 hover:text-indigo-500 ml-auto cursor-pointer">
                                    Forgot password?
                                </button>
                            )}
                            {(formState === 2 || formState === 4) && (
                                <button type="button" onClick={handleResendClick} className="text-indigo-600 hover:text-indigo-500 ml-auto cursor-pointer">
                                    Resend Code
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200">
                                <XCircle className="w-4 h-4" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <StyledWrapper>
                            <button className="button" type="submit" disabled={isLoading || isGoogleLoading}>
                                {isLoading ? (
                                    <Loader color="#ffffff" size={20} />
                                ) : (
                                    <>
                                        <span className="text">{getButtonText()}</span>
                                        <span className="svg">
                                            <svg xmlns="http://www.w3.org/2000/svg" width={40} height={16} viewBox="0 0 38 15" fill="none">
                                                <path fill="white" d="M10 7.519l-.939-.344h0l.939.344zm14.386-1.205l-.981-.192.981.192zm1.276 5.509l.537.843.148-.094.107-.139-.792-.611zm4.819-4.304l-.385-.923h0l.385.923zm7.227.707a1 1 0 0 0 0-1.414L31.343.448a1 1 0 0 0-1.414 0 1 1 0 0 0 0 1.414l5.657 5.657-5.657 5.657a1 1 0 0 0 1.414 1.414l6.364-6.364zM1 7.519l.554.833.029-.019.094-.061.361-.23 1.277-.77c1.054-.609 2.397-1.32 3.629-1.787.617-.234 1.17-.392 1.623-.455.477-.066.707-.008.788.034.025.013.031.021.039.034a.56.56 0 0 1 .058.235c.029.327-.047.906-.39 1.842l1.878.689c.383-1.044.571-1.949.505-2.705-.072-.815-.45-1.493-1.16-1.865-.627-.329-1.358-.332-1.993-.244-.659.092-1.367.305-2.056.566-1.381.523-2.833 1.297-3.921 1.925l-1.341.808-.385.245-.104.068-.028.018c-.011.007-.011.007.543.84zm8.061-.344c-.198.54-.328 1.038-.36 1.484-.032.441.024.94.325 1.364.319.45.786.64 1.21.697.403.054.824-.001 1.21-.09.775-.179 1.694-.566 2.633-1.014l3.023-1.554c2.115-1.122 4.107-2.168 5.476-2.524.329-.086.573-.117.742-.115s.195.038.161.014c-.15-.105.085-.139-.076.685l1.963.384c.192-.98.152-2.083-.74-2.707-.405-.283-.868-.37-1.28-.376s-.849.069-1.274.179c-1.65.43-3.888 1.621-5.909 2.693l-2.948 1.517c-.92.439-1.673.743-2.221.87-.276.064-.429.065-.492.057-.043-.006.066.003.155.127.07.099.024.131.038-.063.014-.187.078-.49.243-.94l-1.878-.689zm14.343-1.053c-.361 1.844-.474 3.185-.413 4.161.059.95.294 1.72.811 2.215.567.544 1.242.546 1.664.459a2.34 2.34 0 0 0 .502-.167l.15-.076.049-.028.018-.011c.013-.008.013-.008-.524-.852l-.536-.844.019-.012c-.038.018-.064.027-.084.032-.037.008.053-.013.125.056.021.02-.151-.135-.198-.895-.046-.734.034-1.887.38-3.652l-1.963-.384zm2.257 5.701l.791.611.024-.031.08-.101.311-.377 1.093-1.213c.922-.954 2.005-1.894 2.904-2.27l-.771-1.846c-1.31.547-2.637 1.758-3.572 2.725l-1.184 1.314-.341.414-.093.117-.025.032c-.01.013-.01.013.781.624zm5.204-3.381c.989-.413 1.791-.42 2.697-.307.871.108 2.083.385 3.437.385v-2c-1.197 0-2.041-.226-3.19-.369-1.114-.139-2.297-.146-3.715.447l.771 1.846z" />
                                            </svg>
                                        </span>
                                    </>
                                )}
                            </button>
                        </StyledWrapper>

                        {(formState > 1) && (
                            <button 
                                type="button" 
                                onClick={() => { setFormState(0); formik.resetForm(); }}
                                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 text-sm mt-2 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Login
                            </button>
                        )}
                    </form>

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
                                className="w-full h-12 flex items-center justify-center gap-3 bg-white cursor-pointer text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all text-sm font-bold"
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

// --- UPDATED SMALLER BUTTON CSS ---
const StyledWrapper = styled.div`
  .button {
    width: 100%;
    height: 48px; /* Fixed smaller height */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px; /* Reduced padding */
    background-color: #4F46E5; 
    border: 4px solid #c7d2fe; /* Reduced border width to 4px */
    color: white; 
    gap: 8px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s;
  }
  .button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background-color: #6366f1;
  }
  .text {
    font-size: 1rem; /* Smaller font */
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .svg {
    padding-top: 3px;
    height: 100%;
    width: fit-content;
    display: flex;
    align-items: center;
  }
  .svg svg {
    width: 30px; /* Smaller SVG */
    height: 18px;
  }
  .button:hover:not(:disabled) {
    border: 4px solid #a5b4fc;
    background-color: #4338ca;
  }
  .button:active:not(:disabled) {
    border: 3px solid #c7d2fe;
    transform: scale(0.99);
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