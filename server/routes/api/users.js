const express = require('express');
const mongodb = require('mongodb');
const jwt = require('jsonwebtoken');
const helpers = require('./helpers');
require('dotenv').config();

const router = express.Router();

/**
 * get all users, filtered by emails if needed
 */
router.get('/', helpers.authenticateToken, helpers.isAdmin, async(req, res) => {
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit) : 1;
    const filter = req.query.filter ? req.query.filter : "";
    const client = await mongodb.MongoClient.connect(process.env.CONNECTION_STRING, {
        useNewUrlParser: true
    });
    const usersClient = await client.db('hct-formation').collection('users');
    const users = await usersClient.find({ email: { '$regex': filter, '$options': 'i' } }, { limit: limit, skip: skip }).toArray();
    return res.send(users);
});

/**
 * edit a user, only self or admin can edit users
 */
router.put('/:id', helpers.authenticateToken, async(req, res) => {
    /*
    TODO:
    validate id, and fields with joi
    check if the token decoded user id is the same of the req.params.id or if the user is admin
    if one of them is true, perfrom the update
    */
});

/**
 * only an admin can delete users
 */
router.delete('/:id', helpers.authenticateToken, helpers.isAdmin, async(req, res) => {
    /**
     * TODO: delete the user and blacklist his token
     */
});


module.exports = router;