const express = require('express')
const router = express.Router()
const {userRegister,verifyMail,login,dashboard,forgetPassword,changePassword}=require('../controllers/use.js')
const multer = require('multer')
const path = require('path')
const seceret = "assd123assd123321"
const oneDay = 1000*60*60*24;
const cookieParser = require('cookie-parser')
const sessions = require('express-session')

router.use(sessions({
    secret: seceret,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}))
//routes
router.get("/",(req,res)=>{
    res.render("user")
})
router.get("/register",(req,res)=>{
    res.render("register")
})
router.get("/login",(req,res)=>{
    res.render("login",{succMsg:'',errMsg:''})
})
router.get('/passwordchange',(req,res)=>{
    res.render('changePassword')
})
router.get('/dashboard',dashboard)
router.get('/verify',verifyMail)


router.get('/forget',(req,res)=>{
    res.render('forget')
})


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/userImages'))
    },
    filename: function (req, file, cb) {
        fileExtension = path.extname(file.originalname)
        cb(null, file.fieldname + '-' + Date.now() + fileExtension)

    }
})
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/jpeg" || file.mimetype == "image/png") {
            cb(null, true)
        }
        else {
            cb(null, false)
            return cb(new Error("Only png and jpeg format allowed"))
        }
    }
})
const uploadSingle = upload.single("image");

router.post('/postRegistrationData',uploadSingle,userRegister)
router.post('/postLoginData',login)
router.post('/forgetPassword',forgetPassword)
router.post('/postChangePassword',changePassword)



module.exports = router;