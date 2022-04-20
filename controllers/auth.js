const { verifyJWT, authenticateUser, generateJWT } = require("../auth");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const {
  sendConfirmationEmail,
  sendForgotPasswordEmail,
  sendEmail,
} = require("../service/mailer");
const userDAO = require("../dao/UserDAO");

class AuthController {
  async verifyToken(token) {
    const decoded = verifyJWT(token);
    if (decoded) {
      const userData = await userDAO.getUser(decoded.id);
      const { user } = authenticateUser(userData);
      return user && userData;
    }
  }

  async confirmUserAccount(token) {
    const confirmedUser = await confirmUserAccount(token);
    if (confirmedUser) {
      const { jwt } = authenticateUser(confirmedUser);
      return jwt;
    }
    console.log("Failed to confirm email");
  }

  async registerUser(user) {
    const newUser = await userDAO.getUserByEmail(user.email);
    if (newUser) {
      console.log("E-mail address already in use");
      return { message: "E-mail address already in use", success: false };
    } else {
      try {
        const userData = await userDAO.createUser(user);

        const { jwt } = authenticateUser(userData);
        console.log("Email address registered successfully");

        await sendConfirmationEmail(userData);
        console.log("Confirmation email sent");
        return {
          message: "Email address registered successfully",
          jwt,
          success: true,
        };
      } catch (err) {
        console.log("Failed to save user", err);
        return { message: "Failed to register user", success: false };
      }
    }
  }

  async loginUser(user) {
    const userData = await userDAO.getUserByEmail(user.email);
    if (userData) {
      if (bcrypt.compareSync(user.password, userData.password)) {
        console.log("Login successful");
        const { jwt } = authenticateUser(userData);
        return { jwt, success: true, message: "Login successful" };
      }
      console.log("Wrong password");
      return { success: false, message: "Wrong password" };
    }
    console.log("User not found");
    return { success: false, message: "User not found" };
  }

  async updateAccount(currentUser, token) {
    const decoded = verifyJWT(token);
    if (decoded) {
      const userData = await userDAO.getUser(currentUser.id);
      if (userData) {
        userData.firstName = currentUser.firstName;
        userData.lastName = currentUser.lastName;
        userData.email = currentUser.email;
      }
      try {
        await userData.save();
        return { success: true, message: "Account updated successfully" };
      } catch (err) {
        console.log("Failed to update account", err);
        return { success: false, message: "Failed to update account" };
      }
    } else {
      console.log("Failed to verify token");
      return {
        success: false,
        message: "Failed to verify token: user is invalid",
      };
    }
  }

  async changePassword(passwordObj, token) {
    const decoded = verifyJWT(token);
    if (decoded) {
      const user = await userDAO.getUser(decoded.id);
      if (user) {
        if (bcrypt.compareSync(passwordObj.oldPassword, user.password)) {
          try {
            user.password = passwordObj.newPassword;
            await user.save();
            console.log("Password changed successfully");
            return { message: "Password changed successfully", success: true };
          } catch (err) {
            console.log("Failed to update password");
            return { message: "Failed to update password", success: false };
          }
        } else {
          console.log("Wrong password");
          return { message: "Wrong password", success: false };
        }
      }
    } else {
      console.log("Invalid user: failed to verify token");
      return {
        message: "Invalid user: failed to verify token",
        success: false,
      };
    }
  }

  async forgotPassword(email) {
    console.log("Forgot password", email);
    const userData = await userDAO.getUserByEmail(email);
    if (userData) {
      console.log("User found");
      try {
        await sendForgotPasswordEmail(userData);
        return { message: "Password reset email sent", success: true };
      } catch (err) {
        console.log("Failed to send email", err);
        return { message: "Failed to send email", success: false };
      }
    } else {
      console.log("User not found");
      return { message: "User not found", success: false };
    }
  }

  async verifyForgotPasswordCode(email, code) {
    console.log("Verifying forgot password code", email, code);
    const userData = await userDAO.getUserByEmail(email);
    if (userData) {
      console.log("User found");

      if (bcrypt.compareSync(code, userData.resetPasswordToken)) {
        console.log("Code verified");
        userData.resetPasswordToken = null;
        userData.resetPasswordWebToken = uuid();
        const token = generateJWT(
          { id: userData._id, uuid: userData.resetPasswordWebToken },
          "1h"
        );

        try {
          await userData.save();
          return { message: "Code verified", success: true, token };
        } catch (err) {
          console.log("Failed to save user", err);
          return {
            message: "Failed to save user: password reset failed",
            success: false,
          };
        }
      } else {
        console.log("Invalid code entered");
        return { message: "Invalid code entered", success: false };
      }
    } else {
      console.log("User not found");
      return { message: "User not found", success: false };
    }
  }

  verifyResetPasswordCode(token) {
    return verifyJWT(`t ${token}`);
  }

  async resetPassword(password, token) {
    const decoded = verifyJWT(`t ${token}`);
    if (decoded) {
      const userData = await userDAO.getUser(decoded.id);
      if (userData && userData.resetPasswordWebToken === decoded.uuid) {
        userData.password = password;
        userData.resetPasswordWebToken = null;
        try {
          await userData.save();
          console.log("Password changed successfully");
          sendEmail(
            "password-reset-successful.ejs",
            userData.email,
            "Password change successful",
            {},
            "Password reset successful"
          );
          console.log("Password change success email sent");
          return {
            message: "Password reset successful",
            success: true,
            jwt: authenticateUser(userData).jwt,
          };
        } catch (err) {
          console.log("Failed to reset password", err);
          return { message: "Failed to reset password", success: false };
        }
      } else {
        console.log("Authentication error: Invalid token");
        return {
          message: "Authentication error: Invalid token",
          success: false,
        };
      }
    }
  }
}

module.exports = new AuthController();
