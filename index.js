require("dotenv").config(); // <-- must be first
const express = require("express"),
  morgan = require("morgan"),
  fs = require("fs"),
  path = require("path"),
  bodyParser = require("body-parser"),
  uuid = require("uuid"),
  mongoose = require("mongoose"),
  Models = require("./models.js"),
  cors = require("cors"),
  { check, validationResult } = require("express-validator");

const app = express();
const Movie = Models.Movie;
const User = Models.User;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error", err));

//local host connection
// mongoose.connect("mongodb://127.0.0.1:27017/filmforge_data", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

app.use(morgan("common"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:1234",
  "https://film-forge-11a9389fe47d.herokuapp.com",
  "https://film-forager.netlify.app/",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        //If a specific origin isn't found on the list of allowed origins
        let message =
          "The CORS policy for this origin doesn't allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

const passport = require("passport");
require("./passport");

let auth = require("./auth")(app);

app.get("/", (req, res) => {
  res.send("Welcome to my Movie APi!");
});

//Add a user
/* We’ll expect JSON in this format
{
  Id_: Integer,
  username: String,
  password: String,
  email: String,
  birthday: Date
}*/
app.post(
  "/users",
  //Validation logic here for request
  //you can either use a chain of methods like .not().empty()
  //which means "opposite of of isEmpty" in plain enlglish "is not empty"
  //or use .isLength({min: 5}) which means
  //minimum value of 5 characters are only allowed
  [
    check("username", "Username is required").isLength({ min: 5 }),
    check(
      "username",
      "Username contains non-alphanumeric characters"
    ).isAlphanumeric(),
    check("password", "Password is required").not().isEmpty(),
    check("email", "Email does not appear to be valid").isEmail(),
  ],
  async (req, res) => {
    //Check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = User.hashPassword(req.body.password);
    await User.findOne({ username: req.body.username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.username + " already exists");
        } else {
          User.create({
            username: req.body.username,
            name: req.body.name,
            password: hashedPassword,
            email: req.body.email,
            birthday: req.body.birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//Get all users
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Authorization check
    if (!req.user || req.user.username !== req.params.username) {
      return res.status(403).send("Permission Denied");
    }
    //CONDITION ENDS
    await User.find()
      .then((users) => {
        res.status(200).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get a user by username
app.get(
  "/users/:username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    //CONDITION TO CHECK HERE
    if (req.user.username !== req.params.username) {
      return res.status(400).send("Permission Denied");
    }
    //CONDITION ENDS
    await User.findOne({ username: req.params.username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Update a user's info, by username
/* We’ll expect JSON in this format
{
  username: String,
  (required)
  password: String,
  (required)
  email: String,
  (required)
  birthday: Date
}*/
app.put(
  "/users/:username",
  [
    check("username", "Username is required").isLength({ min: 5 }),
    check(
      "username",
      "Username contains non-alphanumeric characters"
    ).isAlphanumeric(),
    check("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at lest 6 characters long"),
    check("email", "Email does not appear to be valid").isEmail(),
  ],
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const targetUser = await User.findOne({ username: req.params.username });

    // Authorization check
    if (
      !req.user ||
      !targetUser ||
      req.user._id.toString() !== targetUser._id.toString()
    ) {
      console.log("Auth check failed:");
      console.log("req.user:", req.user?.username);
      console.log("req.params.username:", req.params.username);
      return res.status(403).send("Permission Denied");
    }

    const updatedFields = {
      username: req.body.username,
      name: req.body.name,
      email: req.body.email,
      birthday: req.body.birthday,
    };

    //Only hash and set password if it was provided
    if (req.body.password) {
      updatedFields.password = User.hashPassword(req.body.password);
    }

    await User.findOneAndUpdate(
      { username: req.params.username },
      { $set: updatedFields },
      { new: true }
    )
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//CREATE Add movie to a user's list of favorites
app.post(
  "/users/:username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Authorization check
    if (!req.user || req.user.username !== req.params.username) {
      console.log("Auth check failed:");
      console.log("req.user:", req.user?.username);
      console.log("req.params.username:", req.params.username);
      return res.status(403).send("Permission Denied");
    }
    //CONDITION ENDS

    await User.findOneAndUpdate(
      { username: req.params.username },
      {
        $push: { favoriteMovies: req.params.MovieID },
      },
      { new: true }
    ) //This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//DELETE Allow users to remove a movie from a user's list of favorites
app.delete(
  "/users/:username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Authorization check
    if (!req.user || req.user.username !== req.params.username) {
      console.log("Auth check failed:");
      console.log("req.user:", req.user?.username);
      console.log("req.params.username:", req.params.username);
      return res.status(403).send("Permission Denied");
    }
    //CONDITION ENDS
    await User.findOneAndUpdate(
      { username: req.params.username },
      {
        $pull: { favoriteMovies: req.params.MovieID },
      },
      { new: true }
    ) //This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//DELETE allow user to deregister
app.delete(
  "/users/:username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // Authorization check
    if (!req.user || req.user.username !== req.params.username) {
      console.log("Auth check failed:");
      console.log("req.user:", req.user?.username);
      console.log("req.params.username:", req.params.username);
      return res.status(403).send("Permission Denied");
    }
    //CONDITION ENDS
    await User.findOneAndDelete({ username: req.params.username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.username + " was not found");
        } else {
          res.status(200).send(req.params.username + " was deleted");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//READ get all movies
app.get("/movies", async (req, res) => {
  await Movie.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//READ a movie by title
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movie.findOne({ title: req.params.title })
      .then((movie) => {
        res.status(200).json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//Read all Movies of a Genre
app.get(
  "/movies/genre/:genreName",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movie.find({ "genre.name": req.params.genreName })
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//Read all Directors Movies and their bio
app.get(
  "/movies/director/:directorName",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movie.find({ "director.name": req.params.directorName })
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
