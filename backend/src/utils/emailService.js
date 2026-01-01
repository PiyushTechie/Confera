import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

// Create API instance
const apiInstance = new TransactionalEmailsApi();

// Set the API key correctly
apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

if (!process.env.BREVO_API_KEY) {
  console.error("BREVO_API_KEY is missing in environment variables!");
}

const sendEmail = async (toEmail, subject, htmlContent) => {
  const sendSmtpEmail = new SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = {
    name: "Confera Team",
    email: "confera.noreply@gmail.com" // CHANGE THIS — see below
  };
  sendSmtpEmail.to = [{ email: toEmail }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully. Message ID:', data.body.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email with Brevo:', error);
    if (error.body) {
      console.error('Brevo error response:', error.body);
    }
    throw error; // Re-throw so controller can catch it
  }
};

export default sendEmail;