import * as React from "react";
import styled from "styled-components";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../contexts/AuthContext";
import {
  Lock,
  User,
  CheckCircle,
  XCircle,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Loader from "../components/Loader";
import logo from "../assets/BrandLogo.png";
import { motion, AnimatePresence } from "framer-motion";
import {
  sendOtp,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} from "../services/authApi";

const OtpInput = ({ formik, length = 6 }) => {
  const inputRefs = React.useRef([]);

  const handleChange = (e, index) => {
    let value = e.target.value;

    value = value.replace(/[^0-9]/g, "");

    if (!value && e.target.value !== "") return;

    const currentOtp = formik.values.otp.split("");
    const lastChar = value.substring(value.length - 1);

    currentOtp[index] = lastChar;
    const newOtp = currentOtp.join("");
    formik.setFieldValue("otp", newOtp);

    if (lastChar && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (
      e.key === "Backspace" &&
      !formik.values.otp[index] &&
      index > 0 &&
      inputRefs.current[index - 1]
    ) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, length);
    formik.setFieldValue("otp", data);

    if (data.length > 0) {
      const focusIndex = Math.min(data.length, length - 1);
      if (inputRefs.current[focusIndex]) inputRefs.current[focusIndex].focus();
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-between w-full my-6">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={formik.values.otp[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`w-10 sm:w-12 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border rounded-xl focus:outline-none transition-all shadow-sm
                        ${formik.values.otp[index]
              ? "border-indigo-500 bg-indigo-50/50 text-indigo-700"
              : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            }
                        ${formik.errors.otp && formik.touched.otp
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/10 bg-red-50/50"
              : ""
            }
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

  const loginSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const registerSchema = Yup.object({
    name: Yup.string().trim().required("Full name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "Min 6 chars")
      .required("Password is required"),
  });

  const otpSchema = Yup.object({
    otp: Yup.string()
      .matches(/^\d{6}$/, "Must be exactly 6 digits")
      .required("OTP is required"),
  });

  const forgotSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
  });

  const resetSchema = Yup.object({
    otp: Yup.string()
      .matches(/^\d{6}$/, "Must be exactly 6 digits")
      .required("OTP is required"),
    newPassword: Yup.string()
      .min(6, "Min 6 chars")
      .required("New password is required"),
  });

  const getSchema = () => {
    switch (formState) {
      case 0:
        return loginSchema;
      case 1:
        return registerSchema;
      case 2:
        return otpSchema;
      case 3:
        return forgotSchema;
      case 4:
        return resetSchema;
      default:
        return loginSchema;
    }
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      otp: "",
      newPassword: "",
    },
    validationSchema: getSchema(),
    onSubmit: async (values) => {
      if (isLoading) return;
      setIsLoading(true);
      setError("");
      setMessage("");

      try {
        if (formState === 0)
          await handleLogin(values.email, values.password);

        if (formState === 1) {
          await handleRegister(
            values.name,
            values.password,
            values.email
          );
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
        let msg =
          err.response?.data?.message || err.message || "Error occurred";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
  });

  React.useEffect(() => {
    formik.setErrors({});
    setError("");
    if (formState !== 2 && formState !== 4) formik.setFieldValue("otp", "");
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
    if (!formik.values.email) return setError("Email is missing");
    try {
      await resendOtp(formik.values.email);
      setMessage("OTP Resent!");
      setOpen(true);
    } catch (e) {
      setError("Failed to resend");
    }
  };

  const getTitle = () => {
    if (formState === 0) return "Welcome back";
    if (formState === 1) return "Create an account";
    if (formState === 2) return "Check your email";
    if (formState === 3) return "Reset password";
    if (formState === 4) return "Set new password";
  };

  const getSubTitle = () => {
    if (formState === 0) return (
      <>
        Don't have an account?{" "}
        <button type="button" onClick={() => setFormState(1)} className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors cursor-pointer">
          Sign up
        </button>
      </>
    );
    if (formState === 1) return (
      <>
        Already have an account?{" "}
        <button type="button" onClick={() => setFormState(0)} className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors cursor-pointer">
          Log in
        </button>
      </>
    );
    if (formState === 2 || formState === 4) return (
      <>
        We sent a 6-digit code to <span className="font-semibold text-slate-700">{formik.values.email}</span>
      </>
    );
    if (formState === 3) return "Enter your email to receive a reset link.";
  };

  const getButtonText = () => {
    if (formState === 0) return "Sign In";
    if (formState === 1) return "Sign Up";
    if (formState === 2) return "Verify";
    if (formState === 3) return "Send OTP";
    if (formState === 4) return "Reset";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans p-4 sm:p-8">
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-purple-500/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-full flex items-center gap-3 shadow-lg shadow-emerald-500/10 z-50 text-sm font-semibold"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-10 overflow-hidden">
        <div className="px-8 py-10 sm:px-10 sm:py-12">

          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <img src={logo} alt="Confera" className="h-14 w-auto mb-6" />
            <motion.h2
              key={`title-${formState}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[26px] font-bold tracking-tight text-slate-900 mb-2"
            >
              {getTitle()}
            </motion.h2>
            <motion.p
              key={`subtitle-${formState}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 text-[14.5px]"
            >
              {getSubTitle()}
            </motion.p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={formState}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-4"
              >
                {formState === 1 && (
                  <div className="space-y-4">
                    <InputField
                      id="name"
                      label="Full Name"
                      icon={<User size={18} />}
                      placeholder="Jane Doe"
                      formik={formik}
                    />

                    <InputField
                      id="email"
                      label="Email Address"
                      icon={<Mail size={18} />}
                      placeholder="jane@example.com"
                      formik={formik}
                    />
                  </div>
                )}

                {formState === 0 && (
                  <InputField
                    id="email"
                    label="Email Address"
                    icon={<Mail size={18} />}
                    placeholder="Enter your email"
                    formik={formik}
                  />
                )}

                {(formState === 0 || formState === 1) && (
                  <InputField
                    id="password"
                    type="password"
                    label="Password"
                    icon={<Lock size={18} />}
                    placeholder="••••••••"
                    formik={formik}
                  />
                )}

                {(formState === 2 || formState === 4) && (
                  <div>
                    <OtpInput formik={formik} />
                  </div>
                )}

                {formState === 3 && (
                  <InputField
                    id="email"
                    label="Email Address"
                    icon={<Mail size={18} />}
                    placeholder="jane@example.com"
                    formik={formik}
                  />
                )}

                {formState === 4 && (
                  <InputField
                    id="newPassword"
                    type="password"
                    label="New Password"
                    icon={<Lock size={18} />}
                    placeholder="New secure password"
                    formik={formik}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between items-center text-[13px] font-semibold pt-1">
              {formState === 0 && (
                <button
                  type="button"
                  onClick={() => setFormState(3)}
                  className="text-indigo-600 hover:text-indigo-700 ml-auto transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
              {(formState === 2 || formState === 4) && (
                <button
                  type="button"
                  onClick={handleResendClick}
                  className="text-indigo-600 hover:text-indigo-700 mx-auto transition-colors mt-2 cursor-pointer"
                >
                  Didn't receive a code? Resend
                </button>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 text-red-600 text-[13px] bg-red-50 p-3 rounded-xl border border-red-100 font-medium">
                    <XCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2">
              <StyledWrapper>
                <button
                  className="button"
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? (
                    <Loader color="#ffffff" size={24} />
                  ) : (
                    <>
                      <span className="text">{getButtonText()}</span>
                      <span className="svg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={40}
                          height={16}
                          viewBox="0 0 38 15"
                          fill="none"
                        >
                          <path
                            fill="white"
                            d="M10 7.519l-.939-.344h0l.939.344zm14.386-1.205l-.981-.192.981.192zm1.276 5.509l.537.843.148-.094.107-.139-.792-.611zm4.819-4.304l-.385-.923h0l.385.923zm7.227.707a1 1 0 0 0 0-1.414L31.343.448a1 1 0 0 0-1.414 0 1 1 0 0 0 0 1.414l5.657 5.657-5.657 5.657a1 1 0 0 0 1.414 1.414l6.364-6.364zM1 7.519l.554.833.029-.019.094-.061.361-.23 1.277-.77c1.054-.609 2.397-1.32 3.629-1.787.617-.234 1.17-.392 1.623-.455.477-.066.707-.008.788.034.025.013.031.021.039.034a.56.56 0 0 1 .058.235c.029.327-.047.906-.39 1.842l1.878.689c.383-1.044.571-1.949.505-2.705-.072-.815-.45-1.493-1.16-1.865-.627-.329-1.358-.332-1.993-.244-.659.092-1.367.305-2.056.566-1.381.523-2.833 1.297-3.921 1.925l-1.341.808-.385.245-.104.068-.028.018c-.011.007-.011.007.543.84zm8.061-.344c-.198.54-.328 1.038-.36 1.484-.032.441.024.94.325 1.364.319.45.786.64 1.21.697.403.054.824-.001 1.21-.09.775-.179 1.694-.566 2.633-1.014l3.023-1.554c2.115-1.122 4.107-2.168 5.476-2.524.329-.086.573-.117.742-.115s.195.038.161.014c-.15-.105.085-.139-.076.685l1.963.384c.192-.98.152-2.083-.74-2.707-.405-.283-.868-.37-1.28-.376s-.849.069-1.274.179c-1.65.43-3.888 1.621-5.909 2.693l-2.948 1.517c-.92.439-1.673.743-2.221.87-.276.064-.429.065-.492.057-.043-.006.066.003.155.127.07.099.024.131.038-.063.014-.187.078-.49.243-.94l-1.878-.689zm14.343-1.053c-.361 1.844-.474 3.185-.413 4.161.059.95.294 1.72.811 2.215.567.544 1.242.546 1.664.459a2.34 2.34 0 0 0 .502-.167l.15-.076.049-.028.018-.011c.013-.008.013-.008-.524-.852l-.536-.844.019-.012c-.038.018-.064.027-.084.032-.037.008.053-.013.125.056.021.02-.151-.135-.198-.895-.046-.734.034-1.887.38-3.652l-1.963-.384zm2.257 5.701l.791.611.024-.031.08-.101.311-.377 1.093-1.213c.922-.954 2.005-1.894 2.904-2.27l-.771-1.846c-1.31.547-2.637 1.758-3.572 2.725l-1.184 1.314-.341.414-.093.117-.025.032c-.01.013-.01.013.781.624zm5.204-3.381c.989-.413 1.791-.42 2.697-.307.871.108 2.083.385 3.437.385v-2c-1.197 0-2.041-.226-3.19-.369-1.114-.139-2.297-.146-3.715.447l.771 1.846z"
                          />
                        </svg>
                      </span>
                    </>
                  )}
                </button>
              </StyledWrapper>
            </div>

            {formState > 1 && (
              <button
                type="button"
                onClick={() => {
                  setFormState(0);
                  formik.resetForm();
                }}
                className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 text-[13.5px] mt-4 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            )}
          </form>

          {(formState === 0 || formState === 1) && (
            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
                className="w-full h-[50px] flex items-center justify-center gap-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-[14.5px] font-bold cursor-pointer"
              >
                {isGoogleLoading ? (
                  <Loader color="#4f46e5" size={20} />
                ) : (
                  <>
                    <FcGoogle className="text-xl" />
                    <span>
                      {formState === 0
                        ? "Sign in with Google"
                        : "Sign up with Google"}
                    </span>
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

const InputField = ({
  id,
  label,
  icon,
  type = "text",
  placeholder,
  formik,
}) => (
  <div>
    <label htmlFor={id} className="block text-[13.5px] font-semibold text-slate-700 mb-1.5">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        {icon}
      </div>
      <input
        id={id}
        name={id}
        type={type}
        {...formik.getFieldProps(id)}
        className={`block w-full pl-11 pr-4 py-3 bg-white border rounded-xl text-[14.5px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm ${formik.touched[id] && formik.errors[id]
            ? "border-red-500 focus:ring-red-200 focus:border-red-500"
            : "border-slate-200 hover:border-slate-300"
          }`}
        placeholder={placeholder}
      />
    </div>
    <AnimatePresence>
      {formik.touched[id] && formik.errors[id] && (
        <motion.p
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          className="text-[12.5px] text-red-500 font-medium overflow-hidden"
        >
          {formik.errors[id]}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const StyledWrapper = styled.div`
  .button {
    width: 100%;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px; 
    background-color: #4f46e5;
    border: 4px solid #c7d2fe; 
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
    font-size: 1.05rem; 
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
    width: 30px;
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
    0% {
      transform: scale3d(1, 1, 1);
    }
    30% {
      transform: scale3d(0.75, 1.25, 1);
    }
    40% {
      transform: scale3d(1.25, 0.75, 1);
    }
    50% {
      transform: scale3d(0.85, 1.15, 1);
    }
    65% {
      transform: scale3d(1.05, 0.95, 1);
    }
    75% {
      transform: scale3d(0.95, 1.05, 1);
    }
    100% {
      transform: scale3d(1, 1, 1);
    }
  }
`;
