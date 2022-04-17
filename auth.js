const JWT = require("jsonwebtoken");

function authenticateUser(userData) {
  const currentUser = {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    id: userData._id,
  };

  const jwt = JWT.sign(currentUser, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  return { jwt: `Bearer ${jwt}`, user: currentUser };
}

module.exports = { authenticateUser };
