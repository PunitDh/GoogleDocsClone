const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const authService = require("./auth");
const userDAO = require("../dao/UserDAO");

class MailerService {
  async sendConfirmationEmail(userData) {
    const { jwt, confirmationToken } = this.getConfirmationEmailToken(userData);

    userData.confirmationToken = confirmationToken;

    try {
      await userDAO.saveUser(userData);
    } catch (err) {
      console.log("Failed to save confirmation email token", err);
    }

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
    userData.resetPasswordToken = authService.createHashedPassword(code);
    await userDAO.saveUser(userData);

    this.sendEmail(
      "forgot-password.ejs",
      userData.email,
      `${code} is your code to reset your password`,
      { code },
      "Reset Password"
    );
  }

  async confirmUserAccount(jwt) {
    try {
      const decoded = authService.verifyJWT(jwt);
      const userData = await userDAO.getUser(decoded.id);
      if (userData) {
        if (userData.confirmationToken === decoded.confirmationToken) {
          userData.confirmed = true;
          userData.confirmationToken = null;
          await userDAO.saveUser(userData);
          return userData;
        }
      }
      return false;
    } catch (err) {
      return false;
    }
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
