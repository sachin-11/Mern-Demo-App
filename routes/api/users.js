const express = require('express');
const router = express.Router();
const config = require('config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const gravatar = require('gravatar');
const { check, validationResult } =  require('express-validator')

const User = require('../../models/User');

// @route GET api/users
// @desc Register user
// @access Public
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is required').isEmail(),
    check('password', 'Password can not contain more than 6 charectors').isLength({ min: 6})

] , async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()})
    }

    const { name, email, password} = req.body
      try {
    
        let user = await User.findOne({ email });
        if(user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists'}]});
        }
      const avatar = gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm'
      })

      user = new User({
          name,
          email,
          avatar,
          password
      })

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt)

       await user.save();
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