const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
    })
    const result = await user.save();
    const {password, ...data} = await result.toJSON();
  res.send(data);
});


router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).send({ message: 'User not found' });

    if(!await bcrypt.compare(req.body.password, user.password)) {
        return res.status(400).send({ message: 'Invalid password' });
    }

    const token = jwt.sign({ _id: user._id }, 'secretKey');
    // res.send({ message: 'Login successful', token });
    res.cookie('jwt', token, { httpOnly: true, maxAge: 24 * 60 * 60 }) ;

    res.send({ message: 'Login successful' });
});


router.get('/user', async (req, res) => {
    const cookie = req.cookies['jwt'];
    const claims = jwt.verify(cookie, 'secretKey');
    if (!claims) {
        return res.status(401).send({ message: 'Unauthenticated' });
    }

    const user = await User.findOne({ _id: claims._id });
    const {password, ...data} = await user.toJSON();
    res.send(data);


});
module.exports = router;