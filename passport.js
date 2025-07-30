const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Models = require("./models.js");
const passportJWT = require("passport-jwt");

const User = Models.User;
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async (username, password, callback) => {
      try {
        const user = await User.findOne({ username: username });

        if (!user) {
          console.log("Incorrect username");
          return callback(null, false, {
            message: "Incorrect username or password.",
          });
        }

        if (!user.validatePassword(password)) {
          console.log("Stored hash: ", user.password);
          console.log("Provided password: ", password);
          console.log("Validation result: ", user.validatePassword(password));
          return callback(null, false, {
            message: "Incorrect password.",
          });
        }

        console.log("Login successful");
        return callback(null, user);
      } catch (error) {
        console.error("Error during LocalStrategy: ", error);
        return callback(error);
      }
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest:  ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (jwtPayload, callback) => {
      try {
        const user = await User.findById(jwtPayload._id);

        if(!user) {
          return callback(null,false);
        }

        return callback(null,user);
      } catch (error) {
        console.error("Error during JWT Strategy:", error);
        return callback(error);
      }
    }
  )
);
