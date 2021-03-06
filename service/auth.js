const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");

class AuthService {
  authenticateUser(userData) {
    const user = {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      id: userData._id,
      confirmed: userData.confirmed,
      superUser: userData.superUser,
      picture: userData.picture,
      googleId: userData.googleId,
    };

    return {
      jwt: `Bearer ${this.generateJWT(user)}`,
      user,
    };
  }

  generateJWT(data) {
    return JWT.sign(data, process.env.JWT_SECRET);
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

  decodeJWT(token) {
    return JWT.decode(token);
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
