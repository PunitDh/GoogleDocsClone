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
    });

    return await this.saveUser(newUser);
  }

  async deleteUser(userId) {
    return await User.findByIdAndDelete(userId);
  }

  async saveUser(user) {
    return await user.save();
  }
}

module.exports = new UserDAO();
