const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const User = require("../models/User");

// Configuration multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });


/*USER REGISTER*/
router.post("/register", upload.single('profileImage'), async (req, res) => {
    try{
        const {firstName, lastName, email, password} = req.body;

        const profileImage = req.file

        if(!profileImage) {
            return res.status(400).send("No file uploaded");
        }

        const profileImagePath = profileImage.path;

        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(409).json({message: "User already exists!"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

//crete new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            profileImagePath
        });
//save user
        await newUser.save();
        
        res.status(201).json({message: "User created successfully!"});
    } catch(err) {
        console.log(err);
        res.status(500).json({ message: "Registration failed!", error:err.message});
    }
});


router.post("/login", async (req, res) => {
    try {
        //Take information from the post
        const {email, password} = req.body;

        //Check if the user exists
        const user = await User.findOne({email});
        if(user) {
            return res.status(400).json({message: "User doesn't exist!"});
        }

        //Compare the password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({message: "Invalid credentials!"});
        }

        //Generate jwt token
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
        delete user.password;

        res.status(200).json({token, id: user._id});

    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Login failed!", error: err.message});
    }
})
module.exports = router;