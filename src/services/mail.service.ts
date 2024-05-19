import mailjet from "node-mailjet";

const mailjetClient = mailjet.apiConnect(
  process.env.MAILJET_API_KEY!,
  process.env.MAILJET_SECRET_KEY!
);

export const sendEmail = async (to: string, subject: string, htmlBody: string) => {
  return await mailjetClient.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: process.env.FROM_EMAIL!,
          Name: "huna2" + (!process.env.NODE_ENV || process.env.NODE_ENV! === 'prod' ? '' : (' ' + process.env.NODE_ENV!)),
        },
        To: [
          {
            Email: to,
          },
        ],
        Subject: subject,
        HTMLPart: htmlBody
      },
    ],
  });
};

export default sendEmail;
