const JWT = require("jsonwebtoken");

function authenticateUser(userData) {
  const currentUser = {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    id: userData._id,
    confirmed: userData.confirmed,
  };

  return { jwt: `Bearer ${generateJWT(currentUser)}`, user: currentUser };
}

function generateJWT(userData, expiresIn = "1d") {
  return JWT.sign(userData, process.env.JWT_SECRET, {
    expiresIn,
  });
}

function verifyJWT(token) {
  try {
    return JWT.verify(token.split(" ")[1], process.env.JWT_SECRET);
  } catch (err) {
    return false;
  }
}

module.exports = { authenticateUser, generateJWT, verifyJWT };
