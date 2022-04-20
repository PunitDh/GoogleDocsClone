const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");

class AuthService {
  authenticateUser(userData) {
    const currentUser = {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      id: userData._id,
      confirmed: userData.confirmed,
      superUser: userData.superUser,
    };

    return {
      jwt: `Bearer ${this.generateJWT(currentUser)}`,
      user: currentUser,
    };
  }

  generateJWT(userData, expiresIn = "1d") {
    return JWT.sign(userData, process.env.JWT_SECRET, {
      expiresIn,
    });
  }

  verifyToken(token) {
    try {
      return JWT.verify(token.split(" ")[1], process.env.JWT_SECRET);
    } catch (err) {
      return false;
    }
  }

  verifyJWT(jwt) {
    try {
      return JWT.verify(jwt, process.env.JWT_SECRET);
    } catch (err) {
      return false;
    }
  }

  verifyPassword(password, userDataPassword) {
    return bcrypt.compareSync(password, userDataPassword);
  }

  generateUUID() {
    return uuid();
  }

  createHashedPassword(password) {
    const salt = bcrypt.genSaltSync(Number(process.env.SALT_ROUNDS));
    return bcrypt.hashSync(password, salt);
  }
}

module.exports = new AuthService();
