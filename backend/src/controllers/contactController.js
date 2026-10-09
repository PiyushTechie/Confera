import sendEmail from '../utils/emailService.js';

export const submitContactForm = async (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;

  if (!firstName || !lastName || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const emailContent = `
  <div style="background-color: #f6f8fa; padding: 40px 20px; font-family: 'Tahoma', 'Georgia', sans-serif;">
    <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e1e4e8; overflow: hidden; box-shadow: 0 1px 3px rgba(27,31,35,0.04);">
      
      <!-- Header -->
      <div style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #eaecef;">
        <h2 style="margin: 0; color: #24292e; font-size: 20px;">New Contact Form Submission</h2>
      </div>

      <!-- Body -->
      <div style="padding: 40px;">
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: none; border-top: 1px solid #eaecef; margin: 24px 0;" />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; color: #586069;">${message}</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #fafbfc; padding: 24px 40px; text-align: center; border-top: 1px solid #eaecef;">
        <p style="color: #6a737d; font-size: 12px; margin: 0;">
          This email was sent from the Confera Contact Form.
        </p>
      </div>
      
    </div>
  </div>
`;

    const adminEmail = process.env.ADMIN_EMAIL || "confera.noreply@gmail.com";
    await sendEmail(adminEmail, `Contact Form: ${subject}`, emailContent);

    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("Contact Form Error:", err);
    res.status(500).json({ message: "Server error while sending message" });
  }
};
