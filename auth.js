const jwtSecret = process.env.JWT_SECRET; //This has to be the same key used in the JWTSrategy
const jwt = require("jsonwebtoken"),
  passport = require("passport");
const { token } = require("morgan");

require("./passport");

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.username, // This is the username you're encoding in the JWT
    expiresIn: "7d", //This specifies that the token will expire in 7 days
    algorithm: "HS256", //This is the alogorithm used to "sign" or encode the values of the JWT
  });
};

/* POST Login */
module.exports = (router) => {
  router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (error) {
        return res.status(500).json({
          message: "Internal Server Error",
          error: error.message || error,
        });
      }

      if (!user) {
        return res.status(401).json({
          message: "Login failed",
          reason: info ? info.message : "Invalid Credentials",
        });
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          return res.send(500).json({ message: "Login error", error });
        }

        const tokenPayload = {
          _id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          birthday: user.birthday,
          favoriteMovies: user.favoriteMovies || [],
        };

        let token = generateJWTToken(tokenPayload);
        return res.json({ user: tokenPayload, token });
      });
    })(req, res);
  });
};
