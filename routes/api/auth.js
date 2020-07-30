const express = require('express');
const router = express.Router();
const config = require('config');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const auth = require('../../middleware/auth');

const User = require('../../models/User');

// @route GET api/auth
// @desc  Get logged in user
// @access Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
       console.error(error.message);
       res.status(500).json({message: 'Server Error'}) 
    }
})


// @route POST api/auth
// @desc  Login user
// @access Private

router.post('/', [
    check('email', 'Email is required').isEmail(),
    check('password', 'Password can not contain more than 6 charectors').exists()

] , async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()})
    }

    const { email, password} = req.body
      try {
    
        let user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credientials'}]});
        }
       
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({ errors: [{ msg: 'Invalid Credientials'}]});
        }
       const payload = {
           user: {
               id: user.id
           }
       }

       jwt.sign(payload, config.get('Secret'), {
           expiresIn: 360000
       }, (err, token) => {
           if(err) throw err;
           res.json({ token })
       })
      } catch (error) {
          console.error(error.message);
          res.status(500).json({ success: false, message: 'Server Error'})
      }     
})

module.exports = router;