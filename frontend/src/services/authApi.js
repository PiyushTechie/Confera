import axios from 'axios';

// Ensure this matches your backend URL
const API_URL = 'http://localhost:5000/api/auth'; 

export const sendOtp = async (email) => {
  return await axios.post(`${API_URL}/send-otp`, { email });
};

export const verifyOtp = async (email, otp) => {
  return await axios.post(`${API_URL}/verify-otp`, { email, otp });
};

export const resendOtp = async (email) => {
  return await axios.post(`${API_URL}/resend-otp`, { email });
};

export const forgotPassword = async (email) => {
  return await axios.post(`${API_URL}/forgot-password`, { email });
};

export const resetPassword = async (email, otp, newPassword) => {
  return await axios.post(`${API_URL}/reset-password`, { email, otp, newPassword });
};