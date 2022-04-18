const nodemailer = require("nodemailer");
const User = require("./models/User");
const { v4: uuid } = require("uuid");
const { authenticateUser } = require("./auth");

async function sendConfirmationEmail(userId) {
  const userData = await User.findById(userId);
  if (!userData) return;
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
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"Docs" <' + process.env.EMAIL_USER + ">",
    subject: "Docs: Please confirm your account",
    html: `<p>Please confirm your account by clicking this link: <a href="${process.env.FRONTEND_URL}/confirm-account?token=${jwt}">Confirm account</a></p>`,
    to: userData.email,
  };

  transporter.use(
    "compile",
    (mail, callback) => {
      const compiled = mail.compile();
      callback(null, compiled);
    },
    {
      maxRetries: 1,
    }
  );

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      return false;
    } else {
      return true;
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
