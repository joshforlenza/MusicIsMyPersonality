import './db.mjs';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import * as functions from './functions.mjs';
import path from 'path'
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'hbs');

//middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));

// require authenticated user for /summary
app.use(functions.authRequired(['/summary']));

// make {{user}} variable available for all paths
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// logging
app.use((req, res, next) => {
    console.log(req.method, req.path, req.body);
    next();
});

//route handling
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/summary', (req, res) => {
    res.render('summary');
});

app.get('/leaderboards', (req, res) => {
    res.render('leaderboards');
});



app.listen(process.env.PORT || 3000);
