const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path');
    
const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname,
    'log.txt'), {flags: 'a'})

let Movies = [
    {
        title: 'Avatar'
    },
    {
        title: 'Avatar: The Way of Water'
    },
    {
        title: 'Star Wars: The Force Awakens'
    },
    {
        title: 'Jurassic World'
    },
    {
        title: 'Star Wars: The Last Jedi'
    },
    {
        title: 'Jurassic World: Fallen Kingdom'
    },
    {
        title: 'Transformers Dark of the Moon'
    },
    {
        title: 'Transformers: Age of Extinction'
    },
    {
        title: 'Jurassic Park'
    },
    {
        title: 'Starwars; Rise of Skywalker'
    }
]

// GET Requests
app.use(morgan('common'));

app.get('/', (req,res) => {
    res.send('Welcome to Movies API');
} ) 
app.get('/movies', (req,res) => {
    res.json(Movies);
} ) 
app.use('/documentation.html', express.static('documentation.html'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8080, () => {
    console.log('Listening on port 8080');
});

