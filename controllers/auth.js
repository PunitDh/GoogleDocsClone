const userDAO = require("../dao/UserDAO");
const mailerService = require("../service/mailer");
const authService = require("../service/auth");
const axios = require("axios");

class AuthController {
  async verifyToken(token) {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      const userData = await userDAO.getUser(decoded.id);
      const { user } = authService.authenticateUser(userData);
      return user && userData;
    }
  }

  async confirmUserAccount(token) {
    const confirmedUser = await userDAO.confirmUserAccount(token);
    if (confirmedUser) {
      const { jwt } = authService.authenticateUser(confirmedUser);
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

        const { jwt } = authService.authenticateUser(userData);
        console.log("Email address registered successfully");
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
      if (authService.verifyPassword(user.password, userData.password)) {
        console.log("Login successful");
        const { jwt } = authService.authenticateUser(userData);
        return { jwt, success: true, message: "Login successful" };
      }
      console.log("Wrong password");
      return { success: false, message: "Wrong password" };
    }
    console.log("User not found");
    return { success: false, message: "User not found" };
  }

  async googleAuthCode(code) {
    const url = process.env.GOOGLE_TOKEN_URL;
    const values = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.FRONTEND_URL + "/login/oauth",
      grant_type: "authorization_code",
    };
    return axios
      .post(url, new URLSearchParams(values).toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .then(async (res) => {
        const googleUser = authService.decodeJWT(res.data.id_token);

        const user = await userDAO.getUserByEmail(googleUser.email);
        let jwt;
        if (!user) {
          const newUser = await userDAO.createGoogleUser(googleUser);
          jwt = authService.authenticateUser(newUser).jwt;
        } else {
          const updatedUser = await userDAO.updateGoogleUser(user, googleUser);
          jwt = authService.authenticateUser(updatedUser).jwt;
        }

        return { jwt, success: true, message: "Login successful" };
      })
      .catch((err) => {
        console.log(err);
        return {
          message: "Failed to authenticate with Google",
          success: false,
        };
      });
  }

  async updateAccount(currentUser, token) {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      try {
        await userDAO.updateUser(currentUser);
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
    const decoded = authService.verifyToken(token);
    if (decoded) {
      const user = await userDAO.getUser(decoded.id);
      if (user) {
        if (
          authService.verifyPassword(passwordObj.oldPassword, user.password)
        ) {
          try {
            await userDAO.updatePassword(user, passwordObj.newPassword);
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
        await mailerService.sendForgotPasswordEmail(userData);
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

      if (authService.verifyPassword(code, userData.resetPasswordToken)) {
        console.log("Code verified");
        userData.resetPasswordToken = null;
        userData.resetPasswordWebToken = authService.generateUUID();
        const token = authService.generateJWT(
          { id: userData._id, uuid: userData.resetPasswordWebToken },
          "1h"
        );

        try {
          await userDAO.saveUser(userData);
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

  verifyResetPasswordCode(jwt) {
    return authService.verifyJWT(jwt);
  }

  async resetPassword(password, jwt) {
    const decoded = authService.verifyJWT(jwt);
    if (decoded) {
      const userData = await userDAO.getUser(decoded.id);
      if (userData && userData.resetPasswordWebToken === decoded.uuid) {
        userData.password = password;
        userData.resetPasswordWebToken = null;
        try {
          await userDAO.saveUser(userData);
          console.log("Password changed successfully");
          mailerService.sendEmail(
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
            jwt: authService.authenticateUser(userData).jwt,
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
