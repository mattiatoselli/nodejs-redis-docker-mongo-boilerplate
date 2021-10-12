const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongodb = require('mongodb');
const redis = require("redis");
const bluebird = require('bluebird');
bluebird.promisifyAll(redis);
const redisClient = redis.createClient({
    port: 6379,
    host: 'redis'
});


/**
 * authenticate tokens middleware
 */
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.status(401).send({
        status: "error",
        message: "Provide Bearer Token in headers"
    });
    try {
        //validate formats and expiration of the token
        var decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        //not so fast.... maybe this token was blacklisted?
        if (await redisClient.getAsync(token) != null) {
            return res.status(401).send({
                status: "error",
                message: "token blacklisted",
            });
        }
        next();
    } catch (err) {
        return res.status(401).send({
            status: "error",
            message: err.message
        });
    }
}

async function isAdmin(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    var decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    if (decoded.user.accessLevel != "ADM") {
        return res.status(403).send({
            status: "error",
            message: "not an admin",
        });
    }
    next();
}

module.exports = { authenticateToken, isAdmin };