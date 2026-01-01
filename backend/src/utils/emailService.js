import brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

// Configure the API client
const apiInstance = new brevo.TransactionalEmailsApi();
const apiKey = brevo.TransactionalEmailsApiApiKeys.apiKey;
apiInstance.setApiKey(apiKey, process.env.BREVO_API_KEY);

const sendEmail = async (toEmail, subject, htmlContent) => {
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = { name: "Confera Team", email: "confera.noreply@gmail.com" }; // Change to your verified sender
  sendSmtpEmail.to = [{ email: toEmail }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully. Message ID:', data.body.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export default sendEmail;