const User = require("../models/User");
const authService = require("../service/auth");
const mailerService = require("../service/mailer");

class UserDAO {
  async getUser(userId) {
    return await User.findById(userId);
  }

  async getUserByEmail(email) {
    return await User.findOne({ email });
  }

  async createUser(user) {
    const newUser = {
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      googleId: user.sub && user.sub,
      picture: user.picture && user.picture,
    };

    return await this.saveNewUser(newUser);
  }

  async createGoogleUser(googleUser) {
    const newUser = {
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      googleId: googleUser.sub,
      picture: googleUser.picture,
      password: authService.createHashedPassword(authService.generateUUID()),
    };

    return await this.saveNewUser(newUser);
  }

  async saveNewUser(user) {
    try {
      const newUser = new User(user);
      const confirmationToken = await mailerService.sendConfirmationEmail(user);
      newUser.confirmationToken = confirmationToken;
      return await this.saveUser(newUser);
    } catch (err) {
      console.log("Failed to save confirmation email token", err);
    }
  }

  async updatePassword(user, newPassword) {
    user.password = newPassword;
    return await this.saveUser(user);
  }

  async updateGoogleUser(user, googleUser) {
    user.googleId = googleUser.sub;
    user.picture = googleUser.picture;
    return await this.saveUser(user);
  }

  async updateUser(user, info) {
    if (!info) {
      return await User.findByIdAndUpdate(user._id, user);
    }
    const updatedUser = await User.findByIdAndUpdate(user.id || user._id, info);
    console.log("User updated", updatedUser);
    return updatedUser;
  }

  async deleteUser(userId) {
    return await User.findByIdAndDelete(userId);
  }

  async confirmUserAccount(jwt) {
    try {
      const decoded = authService.verifyJWT(jwt);
      const userData = await this.getUserByEmail(decoded.email);

      if (userData) {
        if (userData.confirmationToken === decoded.confirmationToken) {
          await this.updateUser(userData, {
            confirmed: true,
            confirmationToken: null,
          });
          return userData;
        }
      }
      console.log("User not found: Invalid token", jwt);
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async saveUser(user) {
    try {
      return await user.save();
    } catch (err) {
      console.log("Failed to save user", err);
    }
  }
}

module.exports = new UserDAO();
