const User = require("../models/User");

class UserDAO {
  async getUser(userId) {
    return await User.findById(userId);
  }

  async getUserByEmail(email) {
    return await User.findOne({ email });
  }

  async createUser(user) {
    const newUser = new User({
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      googleId: user.sub && user.sub,
      picture: user.picture && user.picture,
    });

    return await this.saveUser(newUser);
  }

  async createGoogleUser(googleUser) {
    const newUser = new User({
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      googleId: googleUser.sub,
      picture: googleUser.picture,
      password: "",
    });

    return await this.saveUser(newUser);
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

  async updateUser(user) {
    return await User.findByIdAndUpdate(user.id, user);
  }

  async deleteUser(userId) {
    return await User.findByIdAndDelete(userId);
  }

  async saveUser(user) {
    return await user.save();
  }
}

module.exports = new UserDAO();
