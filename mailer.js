const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const User = require("./models/User");
const { v4: uuid } = require("uuid");
const { authenticateUser } = require("./auth");
const JWT = require("jsonwebtoken");

async function sendConfirmationEmail(userData) {
  const { jwt, confirmationToken } = getConfirmationEmailToken(userData);

  userData.confirmationToken = confirmationToken;

  try {
    await userData.save();
  } catch (err) {
    console.log("Failed to save confirmation email token", err);
  }

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
    path.join(__dirname, "views", "confirm-email.ejs"),
    "utf8"
  );

  const mailOptions = {
    from: '"PunitDh Docs" <' + process.env.EMAIL_USER + ">",
    subject: "PunitDh Docs: Please confirm your account",
    html: ejs.render(emailFile, {
      url: process.env.FRONTEND_URL,
      token: jwt,
    }),
    to: userData.email,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Confirmation email sent to:", userData.email, info.response);
    }
  });
}

function getConfirmationEmailToken(userData) {
  const confirmationToken = uuid();
  const { user } = authenticateUser(userData);
  return {
    jwt: JWT.sign({ ...user, confirmationToken }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    }),
    confirmationToken,
  };
}

async function verifyConfirmation(token) {
  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const userData = await User.findById(decoded.id);
    if (userData) {
      if (userData.confirmationToken === decoded.confirmationToken) {
        userData.confirmed = true;
        userData.confirmationToken = null;
        await userData.save();
        return true;
      }
    }
  } catch (err) {
    return false;
  }
}

module.exports = { sendConfirmationEmail, verifyConfirmation };
