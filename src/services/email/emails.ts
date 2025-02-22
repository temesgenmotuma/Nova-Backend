import { mailTrapClient, sender } from "./mailtrap";
import { VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates";

export const sendEmail = async (email: string) => {
  const recipient = [{ email }];

  try {
    await mailTrapClient.send({
      category: "Employee Invite",
      from: sender,
      to: recipient,
      subject: "Employee Invite",
      html: VERIFICATION_EMAIL_TEMPLATE,
    });
    console.log("Email sent successfully to: ", email);
  } catch (error) {
    throw new Error("Error sending email. " + error);
  }
};
