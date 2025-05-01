const express = require("express"),
  morgan = require("morgan"),
  fs = require("fs"),
  path = require("path"),
  bodyParser = require("body-parser"),
  uuid = require("uuid");

const app = express();

app.use(morgan("common"));
app.use(bodyParser.json());

let users = [
  {
    id: 1,
    name: "Alice Johnson",
    favoriteMovies: ["Arrival"],
  },
  {
    id: 2,
    name: "Brian Smith",
    favoriteMovies: [],
  },
  {
    id: 3,
    name: "Chloe Martinez",
    favoriteMovies: [],
  },
];

let movies = [
  {
    title: "Blade Runner",
    director: {
      name: "Ridley Scott",
      bio: "Ridley Scott is an English film director and producer known for creating visually striking science fiction and historical epics.",
      yearBorn: 1937,
    },
    genre: {
      name: "Science Fiction",
      description:
        "A genre that explores futuristic concepts such as advanced science, technology, space exploration, and artificial intelligence.",
    },
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/5/53/Blade_Runner_poster.jpg"
  },
  {
    title: "2001: A Space Odyssey",
    director: {
      name: "Stanley Kubrick",
      bio: "Stanley Kubrick was an American film director known for his meticulous craftsmanship and for pushing the boundaries of cinematic storytelling.",
      yearBorn: 1928,
    },
    genre: {
      name: "Science Fiction",
      description:
        "A genre focusing on imaginative and futuristic concepts, often delving into space travel, alien life, and the nature of consciousness.",
    },
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/e/e1/2001_A_Space_Odyssey_%281968%29.png"
  },
  {
    title: "The Matrix",
    director: {
      name: "The Wachowskis",
      bio: "Lana and Lilly Wachowski are American film and TV directors, writers, and producers best known for their work on The Matrix franchise.",
      yearBorn: 1965,
    },
    genre: {
      name: "Cyberpunk",
      description:
        "A subgenre of science fiction set in a dystopian future where high-tech and low-life intersect, often involving hackers and AI.",
    },
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/c/c1/The_Matrix_Poster.jpg"
  },
  {
    title: "Inception",
    director: {
      name: "Christopher Nolan",
      bio: "Christopher Nolan is a British-American filmmaker known for blending intellectual storytelling with large-scale, high-concept cinema.",
      yearBorn: 1970,
    },
    genre: {
      name: "Science Fiction Thriller",
      description:
        "A genre that combines speculative scientific elements with fast-paced, suspenseful storytelling.",
    },
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/7/7f/Inception_ver3.jpg"
  },
  {
    title: "Arrival",
    director: {
      name: "Denis Villeneuve",
      bio: "Denis Villeneuve is a Canadian filmmaker acclaimed for his atmospheric and thought-provoking science fiction and drama films.",
      yearBorn: 1967,
    },
    genre: {
      name: "Science Fiction Drama",
      description:
        "A genre that uses speculative science fiction elements to explore deep emotional or philosophical themes.",
    },
    imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/df/Arrival_%282016_film%29.jpg"
  },
];


//CREATE
app.post("/users", (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send("User not created");
  }
});

//UPDATE
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send("User not found");
  }
});

//CREATE
app.post("/users/:id/:movieTitle", (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res
      .status(200)
      .send(
        `${movieTitle} has been added to user ${id}'s favorite Movies array `
      );
  } else {
    res.status(400).send("User not updated");
  }
});

//DELETE
app.delete("/users/:id/:movieTitle", (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter(
      (title) => title !== movieTitle
    );
    res
      .status(200)
      .send(
        `${movieTitle} has been removed from user ${id}'s favorite Movies array `
      );
  } else {
    res.status(400).send("User not updated");
  }
});

//DELETE
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    users = users.filter((user) => user.id != id);
    res.status(200).send(`User with ID ${id} has been deleted`);
  } else {
    res.status(400).send("User not found");
  }
});

//READ
app.get("/movies", (req, res) => {
  res.status(200).json(movies);
});

//READ
app.get("/movies/:title", (req, res) => {
  const { title } = req.params;
  const movie = movies.find((movie) => movie.title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send("Movie not found");
  }
});

//Read
app.get("/movies/genre/:genreName", (req, res) => {
  const { genreName } = req.params;
  const genre = movies.find((movie) => movie.genre.name === genreName).genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send("Genre not found");
  }
});

//Read
app.get("/movies/director/:directorName", (req, res) => {
  const { directorName } = req.params;
  const director = movies.find(
    (movie) => movie.director.name === directorName
  ).director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send("Director Not Found.");
  }
});

app.listen(8080, () => {
  console.log("Listening on port 8080");
});
