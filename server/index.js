const express = require('express');
//const bodyParser = require('body-parser'); //TODO: remove bodyparser package
const cors = require('cors');

const app = express();

//Middlewares
//app.use(bodyParser.json()); -> deprecated, use express.json() or express.urlencoded()
app.use(express.json());
app.use(cors());

//routes
const authentication = require('./routes/api/authentication');
const users = require('./routes/api/users');

app.use('/api/authentication', authentication);
app.use('/api/users', users);

//start server
const port = process.env.PORT || 5000;

app.listen(port, () => console.log('server started'));