const express = require('express');
const router = express.Router();
const config = require('config');
const request = require('request');
const auth = require('../../middleware/auth')
const { check, validationResult } =  require('express-validator');


const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route GET api/profile/me
// @desc Get current users profile
// @access Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id})
        .populate('user', ['name', 'avatar']);

        if(!profile){
           return res.status(400).json({ msg: 'There is no profile for this user'}) 
        }

        res.json(profile)

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error'})
    }
});

// @route POST api/profile
// @desc Create and update user profile
// @access Private

router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }
    const {
        company,
        location,
        website,
        bio,
        skills,
        status,
        githubusername,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook
      } = req.body;

      //build profileField Object
      const profileFields = {}

      profileFields.user = req.user.id
    if(company) profileFields.company = company
    if (location) profileFields.location = location;
    if (website) profileFields.website = website;
    if (bio) profileFields.bio = bio;
    if (skills) profileFields.skills = skills;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
       
    if(skills){
        profileFields.skills = skills.split(',').map(skill =>skill.trim());
    }
    //build social object

    profileFields.social = {}

    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;
    if (facebook) profileFields.social.facebook = facebook;
    try {
       let profile = await Profile.findOne({ user: req.user.id});
       if(profile){
           //update
           profile = await Profile.findOneAndUpdate({ user: req.user.id}, { $set : profileFields}, { new: true });

           return res.json(profile)
       }

       //Create
       profile = new Profile(profileFields);

       await profile.save();
        res.json(profile);
    } catch (error) {
      console.error(error.message);  
      res.status(500).send('Server error');
    }
})


// @route GET api/profile
// @desc Get all  profile
// @access Public


router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find()
        .populate('user', ['name', 'avatar']);

        res.json(profiles);
    } catch (error) {
       console.error(error.message);
       res.status(500).json({ success: false, message: 'Server Error'}) 
    }
})

// @route GET api/profile
// @desc Get  profile By user ID
// @access Public

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id})
        .populate('user', ['name', 'avatar']);
        if(!profile){
            return res.status(400).json({ success: false, message: 'No profile found for spacific user'})
        }

        res.json(profile);
        
    } catch (error) {
        console.error(error.message);
        if(error.kind === 'ObjectId'){
            return res.status(400).json({ success: false, message: 'No profile found for spacific user'})
        }
        res.status(500).json({ success: false, message: 'Server Error'})
    }
})



// @route DELETE api/profile
// @desc Delete profile, user & posts
// @access Private

router.delete('/', auth, async (req, res) => {
    try {
         //remove profile
         await Profile.findOneAndRemove({ user: req.user.id});
         //Remove user
         await User.findOneAndRemove({ _id: req.user.id});

        res.json({ msg: 'User deleted'});
    } catch (error) {
       console.error(error.message);
       res.status(500).json({ success: false, message: 'Server Error'}) 
    }
})

// @route PUT  api/profile/experience
// @desc Add profile experience
// @access Private

router.put('/experience',[auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From is required').not().isEmpty()
]], async (req,res) =>{
   
const errors = validationResult(req);
if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array()});
}

const { title, company, from, location, to, current, description}  = req.body;

const newExp = {
    title,
    company,
    from,
    description, 
    to,
    location,
    current,
}

try {

    const profile = await Profile.findOne({ user: req.user.id});
    profile.experience.unshift(newExp);

    await profile.save();

    res.json(profile);
    
} catch (error) {
    console.log(error.message);
    res.status(500).json({ msg: 'Server Error'});
}

})


//@route DELETE api/profile/experience/exp_id
//@desc delete experience from profile
//@access Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user.id });
  
      //get remove index
      const removeIndex = profile.experience
        .map((item) => item.id)
        .indexOf(req.params.exp_id);
      profile.experience.splice(removeIndex, 1);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  });

//@route PUT api/profile/education
//@desc Add profile education
//@access Private

router.put(
    "/education",
    [
      auth,
      [
        check("school", "School is required").not().isEmpty(),
        check("degree", "Degree is required").not().isEmpty(),
        check("fieldofstudy", "Field of study  is required").not().isEmpty(),
      ],
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
      } = req.body;
  
      const newEd = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
      };
      try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newEd);
        await profile.save();
        res.json(profile);
      } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
      }
    }
  );


  //@route DELETE api/profile/education/edu_id
  //@desc delete education from profile
  //@access Private
  
  router.delete("/education/:edu_id", auth, async (req, res) => {
    try {
      const profile = await Profile.findOne({ user: req.user.id });
  
      //get remove index
      const removeIndex = profile.education
        .map((item) => item.id)
        .indexOf(req.params.edu_id);
      profile.education.splice(removeIndex, 1);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  });



//@route GET api/profile/github/:username
  //@desc Get user repos from github
  //@access Public

  router.get('/github/:username', async (req,res) => {
    try {
        const options = {
          uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubClientSecret')}`,
          method: 'GET',
          headers: { 'user-agent': 'node.js'}
        }
        request(options, (err, response, body) => {
           if(err) console.log(err);
           if(response.statusCode !== 200){
             return  res.status(404).json({ msg: 'No github profile found'});
           }

           res.json(JSON.parse(body));
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Server Error");
    }
})




module.exports = router;