const express = require("express"),
  morgan = require("morgan"),
  fs = require("fs"),
  path = require("path"),
  bodyParser = require("body-parser"),
  uuid = require("uuid"),
  mongoose = require("mongoose"),
  Models = require("./models.js");

const app = express();
const Movie = Models.Movie;
const User = Models.User;

mongoose.connect("mongodb://localhost:27017/cfDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(morgan("common"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let auth = require("./auth")(app);

const passport = require("passport");
require("./passport");

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
app.post("/users", async (req, res) => {
  await User.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.username + " already exists");
      } else {
        User.create({
          username: req.body.username,
          name: req.body.name,
          password: req.body.password,
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
});

//Get all users
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    //CONDITION TO CHECK HERE
    if (req.user.username !== req.params.username) {
      return res.status(400).send("Permission Denied");
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
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    //CONDITION TO CHECK HERE
    if (req.user.username !== req.params.username) {
      return res.status(400).send("Permission Denied");
    }
    //CONDITION ENDS

    await User.findOneAndUpdate(
      { username: req.params.username },
      {
        $set: {
          username: req.body.username,
          name: req.body.name,
          password: req.body.password,
          email: req.body.email,
          birthday: req.body.birthday,
        },
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

//CREATE Add movie to a user's list of favorites
app.post(
  "/users/:username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    //CONDITION TO CHECK HERE
    if (req.user.username !== req.params.username) {
      return res.status(400).send("Permission Denied");
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
    //CONDITION TO CHECK HERE
    if (req.user.username !== req.params.username) {
      return res.status(400).send("Permission Denied");
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
    //CONDITION TO CHECK HERE
    if (req.user.username !== req.params.username) {
      return res.status(400).send("Permission Denied");
    }
    //CONDITION ENDS
    await User.findOneAndDelete({ username: req.params.username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.username + " was not found");
        } else {
          res.status(400).send(req.params.username + " was deleted");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//READ get all movies
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movie.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

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

app.listen(8080, () => {
  console.log("Listening on port 8080");
});
