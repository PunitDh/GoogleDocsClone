const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const User = require("./models/User");
const { v4: uuid } = require("uuid");
const { authenticateUser, generateJWT } = require("./auth");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");

async function sendConfirmationEmail(userData) {
  const { jwt, confirmationToken } = getConfirmationEmailToken(userData);

  userData.confirmationToken = confirmationToken;

  try {
    await userData.save();
  } catch (err) {
    console.log("Failed to save confirmation email token", err);
  }

  sendEmail(
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

function getConfirmationEmailToken(userData) {
  const confirmationToken = uuid();
  const { user } = authenticateUser(userData);

  return {
    jwt: generateJWT({ ...user, confirmationToken }),
    confirmationToken,
  };
}

async function sendForgotPasswordEmail(userData) {
  const randBetween = (min, max) =>
    String(Math.floor(Math.random() * (max - min) + min));

  const code = randBetween(100000, 999999);
  const salt = bcrypt.genSaltSync(10);
  userData.resetPasswordToken = bcrypt.hashSync(code, salt);
  await userData.save();

  sendEmail(
    "forgot-password.ejs",
    userData.email,
    `${code} is your code to reset your password`,
    { code },
    "Reset Password"
  );
}

async function confirmUserAccount(token) {
  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const userData = await User.findById(decoded.id);
    if (userData) {
      if (userData.confirmationToken === decoded.confirmationToken) {
        userData.confirmed = true;
        userData.confirmationToken = null;
        await userData.save();
        return userData;
      }
    }
    return false;
  } catch (err) {
    return false;
  }
}

function sendEmail(emailTemplate, to, subject, data = {}, loggingInfo = "") {
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
    path.join(__dirname, "views", emailTemplate),
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

module.exports = {
  sendConfirmationEmail,
  confirmUserAccount,
  sendForgotPasswordEmail,
  sendEmail,
};
