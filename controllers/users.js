const { verifyJWT } = require("../auth");
const Document = require("../models/Document");
const User = require("../models/User");
const userDAO = require("../dao/UserDAO");

class UsersController {
  async deletePermanently(token) {
    const decoded = verifyJWT(token);
    if (decoded) {
      const userId = decoded.id;
      try {
        await Document.deleteMany({ userId });
        await User.findByIdAndDelete(userId);
        return { success: true, message: "Account deleted successfully" };
      } catch (err) {
        console.log("Failed to delete user");
        return { success: false, message: "Failed to delete" };
      }
    }
    console.log("Failed to verify token");
    return {
      success: false,
      message: "Failed to verify token: user is invalid",
    };
  }
}

module.exports = new UsersController();
