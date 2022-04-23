const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const authService = require("./auth");
const userDAO = require("../dao/UserDAO");

class MailerService {
  async sendConfirmationEmail(userData) {
    const { jwt, confirmationToken } = this.getConfirmationEmailToken(userData);

    this.sendEmail(
      "confirm-email.ejs",
      userData.email,
      "Please confirm your account",
      {
        url: process.env.FRONTEND_URL,
        token: jwt,
      },
      "Confirmation"
    );

    return confirmationToken;
  }

  getConfirmationEmailToken(userData) {
    const confirmationToken = authService.generateUUID();
    const { user } = authService.authenticateUser(userData);

    return {
      jwt: authService.generateJWT({ ...user, confirmationToken }),
      confirmationToken,
    };
  }

  async sendForgotPasswordEmail(userData) {
    const randBetween = (min, max) =>
      String(Math.floor(Math.random() * (max - min) + min));

    const code = randBetween(100000, 999999);
    userDAO.updateUser(userData, {
      resetPasswordToken: authService.createHashedPassword(code),
    });

    this.sendEmail(
      "forgot-password.ejs",
      userData.email,
      `${code} is your code to reset your password`,
      { code },
      "Reset Password"
    );
  }

  sendEmail(emailTemplate, to, subject, data = {}, loggingInfo = "") {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: process.env.GOOGLE_ACCESS_TOKEN,
        expires: process.env.GOOGLE_EXPIRY_DATE,
      },
    });

    const emailFile = fs.readFileSync(
      path.join(__dirname, "..", "views", emailTemplate),
      "utf8"
    );

    const mailOptions = {
      from: '"PunitDh Docs" <' + process.env.EMAIL_USER + ">",
      to,
      subject: "PunitDh Docs: " + subject,
      html: ejs.render(emailFile, data),
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(loggingInfo, "email sent to", to, info.response);
      }
    });
  }
}

module.exports = new MailerService();
