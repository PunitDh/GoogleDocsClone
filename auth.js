const JWT = require("jsonwebtoken");

function authenticateUser(userData) {
  const currentUser = {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    id: userData._id,
    confirmed: userData.confirmed,
  };

  const jwt = JWT.sign(currentUser, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  return { jwt: `Bearer ${jwt}`, user: currentUser };
}

function verifyJWT(token) {
  try {
    return JWT.verify(token.split(" ")[1], process.env.JWT_SECRET);
  } catch (err) {
    return false;
  }
}

module.exports = { authenticateUser, verifyJWT };
