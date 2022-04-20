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

    return await newUser.save();
  }
}

module.exports = new UserDAO();
