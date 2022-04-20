const userDAO = require("../dao/UserDAO");
const documentDAO = require("../dao/DocumentDAO");
const authService = require("../service/auth");

class UsersController {
  async deletePermanently(token) {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      const userId = decoded.id;
      try {
        await documentDAO.deleteDocumentsByUserId(userId);
        await userDAO.deleteUser(userId);
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
