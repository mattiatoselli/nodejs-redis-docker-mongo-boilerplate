const express = require('express');
const mongodb = require('mongodb');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const helpers = require('./helpers');
require('dotenv').config();
const redis = require("redis");
const bluebird = require('bluebird');
bluebird.promisifyAll(redis);
const redisClient = redis.createClient({
    port: 6379,
    host: 'redis'
});

const router = express.Router();

/*TODO: validate every request in authentication before every logic with Joi,
 *       test all authentication flows, do not leave in cache ancient tokens, for example!*/


//authentication routes:

/**
 * register a user with email, password, name and family name, also provide a default access level
 * default access level is STU (STUDENT), only devs can provide a different access level on users, 
 * like for example ADM or STAFF, or DOC(DOCENTE)
 * registration API for new users
 */
router.post('/register', async(req, res) => {
    const data = req.body;
    const Joi = require('joi');
    const schema = Joi.object({
        email: Joi.string().required().email().messages({
            "any.required": "Email obbligatoria",
            "string.email": "Inserire email valida",
            "string.empty": "Inserire Email"
        }),
        firstName: Joi.string().required().min(2).alphanum().messages({
            "string.min": "Inserire un nome di almeno due lettere",
            "any.required": "Inserire nome",
            "string.empty": "Inserire un nome",
            "string.alphanum": "Stringa non valida"
        }),
        lastName: Joi.string().required().min(2).alphanum().messages({
            "string.min": "Inserire un cognome di almeno due lettere",
            "any.required": "Inserire cognome",
            "string.empty": "Inserire un cognome",
            "string.alphanum": "Stringa non valida"
        }),
        password: Joi.string().required().pattern(new RegExp('^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,15}$')).messages({
            "any.required": "password obbligatoria",
            "string.empty": "password obbligatoria",
            "string.pattern.base": "La password non rispetta i parametri richiesti: minimo 6 caratteri, massimo 15, deve contenere almeno un carattere speciale, un numero, una lettera maiuscola ed una lettera minuscola!"
        })
    });


    try {
        const value = await schema.validateAsync({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            password: data.password,
        });


        //does the user already exists?
        const client = await mongodb.MongoClient.connect(process.env.CONNECTION_STRING, {
            useNewUrlParser: true
        });
        const usersClient = await client.db(process.env.DB_NAME).collection('users');
        const foundUser = await usersClient.findOne({
            email: data.email
        });
        if (foundUser != null) {
            client.close();
            return res.status(400).send({
                data: data,
                status: "error",
                message: "User already exists!!!"
            });
        }


        // generate salt to hash password
        const salt = await bcrypt.genSalt(10);
        // now we set user password to hashed password
        const hashedPassword = await bcrypt.hash(data.password, salt);
        //to check password: => const validPassword = await bcrypt.compare(body.password, user.password); returns a boolean


        const insert = await usersClient.insertOne({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            password: hashedPassword,
            created: new Date(),
            accessLevel: "USER"
        });
        client.close();
        res.send({
            status: "ok",
            data: data,
            message: "User created"
        });
    } catch (err) {
        res.status(400).send({
            data: data,
            status: "error",
            message: err.message
        });
    }
});

/**
 * login route: gets user credentials and return a bearer and refresh token
 */
router.post('/login', async(req, res) => {
    const Joi = require('joi');
    const schema = Joi.object({
        email: Joi.string().required().email(),
        password: Joi.string().required()
    });

    try {
        const value = await schema.validateAsync({
            email: req.body.email,
            password: req.body.password
        });
        const client = await mongodb.MongoClient.connect(process.env.CONNECTION_STRING, {
            useNewUrlParser: true
        });
        const usersClient = await client.db(process.env.DB_NAME).collection('users');
        const foundUser = await usersClient.findOne({ email: req.body.email })
        if (foundUser == null) {
            return res.status(403).send({
                status: "error",
                message: "Invalid credentials"
            });
        }
        if (!(await bcrypt.compare(req.body.password, foundUser.password))) {
            return res.status(403).send({
                status: "error",
                message: "Invalid credentials"
            });
        }

        // create the jwt of the user:
        const token = jwt.sign({ user: foundUser }, process.env.TOKEN_SECRET, { expiresIn: 3600 });

        client.close();
        return res.status(200).send({
            status: "ok",
            data: {
                token: token,
                expires: process.env.EXPIRE_TOKEN_TIME
            },
            message: "authenticated"
        });
    } catch (error) {
        return res.status(401).send({
            status: "error",
            message: error.message
        });
    }
});

/**
 * returns the current authenticated user
 */

router.get('/me', helpers.authenticateToken, async(req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    var user = jwt.verify(token, process.env.TOKEN_SECRET).user;
    return res.send({
        status: "ok",
        data: {
            user
        },
        message: "user entity"
    });
});

/**
 * provide another token for authenticated user
 */
router.post('/refresh', helpers.authenticateToken, async(req, res) => {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
        //use the token to create another one:
    var decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const newToken = jwt.sign({ user: decoded.user }, process.env.TOKEN_SECRET, { expiresIn: 3600 });
    await blackListToken(token);
    return res.status(200).send({
        message: "refreshed",
        status: "ok",
        token: newToken,
        expires: 3600
    });
});


//this function blacklists not expired tokens
async function blackListToken(token) {
    await redisClient.set(token, "blackListed", 'EX', 3600);
    return;
}

module.exports = router;