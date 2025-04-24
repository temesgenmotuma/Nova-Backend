"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailgun_1 = __importDefault(require("./mailgun"));
const sandboxDomain = process.env.MAILGUN_SANDBOX_DOMAIN ||
    "sandbox32208b13b0194a669287c4b7a3cfa313.mailgun.org";
const sendEmail = async (receiverEmail, subject, body) => {
    try {
        const msg = await mailgun_1.default.messages.create(sandboxDomain, {
            from: `Nova Parking <postmaster@${sandboxDomain}>`,
            to: [receiverEmail],
            subject: subject || "",
            html: "<h1>Testing some Mailgun awesomness!</h1>",
            //   template: "invitation-template",
            //   "h:X-Mailgun-Variables"
        });
        console.log(msg);
    }
    catch (error) {
        throw error;
    }
};
exports.default = sendEmail;
//# sourceMappingURL=sendEmail.js.map