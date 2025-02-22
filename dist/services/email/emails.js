"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const mailtrap_1 = require("./mailtrap");
const emailTemplates_1 = require("./emailTemplates");
const sendEmail = async (email) => {
    const recipient = [{ email }];
    try {
        await mailtrap_1.mailTrapClient.send({
            category: "Employee Invite",
            from: mailtrap_1.sender,
            to: recipient,
            subject: "Employee Invite",
            html: emailTemplates_1.VERIFICATION_EMAIL_TEMPLATE,
        });
        console.log("Email sent successfully to: ", email);
    }
    catch (error) {
        throw new Error("Error sending email. " + error);
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=emails.js.map