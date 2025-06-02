import mg from "./mailgun";

const sandboxDomain =
  process.env.MAILGUN_SANDBOX_DOMAIN ||
  "sandbox32208b13b0194a669287c4b7a3cfa313.mailgun.org";

const sendEmail = async ( receiverEmail: string, subject?: string, body?: string ) => {
  try {
    const msg = await mg.messages.create(sandboxDomain, {
      from: `Nova Parking <postmaster@${sandboxDomain}>`,
      to: [receiverEmail],
      subject: subject || "",
      html: `<h1>Testing some Mailgun awesomness!
        ${body || ""}
      </h1>`,
      //   template: "invitation-template",
      //   "h:X-Mailgun-Variables"
    });
    console.log(msg);
  } catch (error) {
    throw error;
  }
};

export default sendEmail;
