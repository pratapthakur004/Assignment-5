//require
const proModel = require('../models/User')
const { route } = require('../routes/mainRouter')
const bcrypt = require('bcrypt')
const saltValue = 10
const nodemailer = require('nodemailer')
const dotenv = require('dotenv').config()

// send verification mail
const sendVerificationMail = async (name, email, id) => {
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            auth: {
                user: process.env.email,
                pass: process.env.pass
            }
        })

        const mailOptions = {
            from: process.env.email,
            to: email,
            subject: "Verification Mail",
            // template:'mail'
            html: `<h4>Hello ${name},&nbsp;&nbsp; Please click here <a href="${process.env.connUrl}/user/verify?_id=${id}">Verify</a></h4>`
        }
        //sending mail
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) console.log(err);
            else console.log("Email send Sucessfully", info.response)
        })

    } catch (error) {
        console.log(error)
    }
}
// verify mail function
const verifyMail = async (req, res) => {
    try {
        //updating status to 1
        const verified = await proModel.updateOne({ _id: req.query._id }, { $set: { status: 1 } })
        if (verified) {
            res.render("verifiedMail")
        }
        else {
            console.log("mail not verified")
        }

    } catch (error) {
        console.log(error)

    }
}

//bcrypting password
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, saltValue)
        return passwordHash

    } catch (error) {
        console.log(error)
    }
}

// user registration
let userRegister = async (req, res, filename) => {

    try {
        let { name, email, password,status } = req.body;
        let name1 = /[a-zA-Z]{0,20}$/;
        let email1 = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        let pass1 = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,24}$/;
        let nameErr;
        let emailErr;
        let passErr;
        if (name1.test(name) && email1.test(email) && pass1.test(password)) {
            //calling securePassword function to bcrypt
            const spassword = await securePassword(req.body.password)
            const bodyData = new proModel({
                email: req.body.email,
                name: req.body.name,
                password: spassword,
                image: req.file.filename,
                status: req.body.status
            });
            let user = new proModel(bodyData)
            console.log(user)

            //saving data into database
            const userData = await user.save()
            if (userData) {
                //sending verification mail
                sendVerificationMail(req.body.name, req.body.email, userData._id)
                res.render('register', { succMsg: "Verification Mail sent" })
            }
            else {
                res.render('register', { errMsg: "Registration failed !" })
            }
        }
        else {
            if (!(name1.test(name))) {
                nameErr = '*First 6 digits are alphabets and 3 next are numbers   ';
            }
            if (!(email1.test(email))) {
                emailErr = '*Email address is not valid';
            }
            if (!(pass1.test(password))) {
                passErr = '*Password invalid (eg. Myname@11)'
            }

            console.log("______err"+nameErr)
            res.render('register', { nameErr: nameErr, emailErr: emailErr, passErr: passErr, })
        }
    }
    catch (err) {
        if (err) res.render('register',{errMsg:"user already exists"})
    }
}

//user login
const login = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        //finding data using email
        const userData = await proModel.findOne({ email: email });

        if (userData) {

            // comparing input password with database password
            const passwordCheck = await bcrypt.compare(password, userData.password);
            if (passwordCheck) {

                if (userData.status == 0) {
                    res.render('login', { errMsg: "Verifivation of account is pending" })
                } else {
                    session = req.session;
                    session.email = email;
                    session.name = userData.name;
                    session.image = userData.image;
                    console.log(req.session);
                    return res.render('dashboard', { session: req.session })
                }
            } else {
                res.render('login', { errMsg: "Email and password is incorrect! " })
            }
        } else {
            res.render('login', { errMsg: "Email and password is incorrect! " })
        }

    } catch (error) {
        console.log(error.errMsg);
    }
}

// user dashboard
const dashboard = async (req, res) => {
    const edata = req.session.email
    if (edata) {
        //finding data
        const data = await proModel.findOne({ email: edata })

        if (!data) res.render('dashboard', { errMsg: "Something went wrong !!!" })
        else {
            res.render('dashboard', { email: data.email, image: data.image, name: data.name })
        }
    }
    else res.redirect('login', { errMsg: "Data not displayed" })
}

// forget password logic
const forgetPassword = async (req, res) => {
    try {
        let userEmail = req.body.email
        let user = await proModel.findOne({ email: userEmail });
        if (user) {
            let transporter = nodemailer.createTransport({
                service: "gmail",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.email,
                    pass: process.env.pass
                }
            })
            const mailOptions = {
                from: process.env.email,
                to: userEmail,
                subject: "forget Password Mail",
                // template:'mail'
                html: `<h4>Hello ${user.name},&nbsp;&nbsp; Please click here to change your password <a href="${process.env.connUrl}/user/passwordchange?id=${user._id}">change password</a></h4>`
            }
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) console.log(err);
                else {
                    console.log("Email send Sucessfully", info.response)
                    res.render('forget', { succMsg: "Change password link is send to your registered mail" })
                }
            })
        }
        else {
            res.render('forget', { errMsg: "Please fill Email Properly !!!" })
        }

    } catch (error) {
        console.log(error)
    }
}

//change password logic
const changePassword = async (req, res) => {
    try {
        let userEmail = req.body.email
        //finding data
        let user = await proModel.findOne({ email: userEmail });
        if (user) {
            let pass1 = req.body.pass1
            let pass2 = req.body.pass2
            if (pass1 == pass2) {
                const secure_password = await securePassword(pass2);

                const updatePass = await proModel.updateOne({ email: userEmail }, { $set: { password: secure_password } })
                res.render('login', { succMsg: "Password Changed Successfully" })
            }
            else {
                res.redirect(changePassword, { errMsg: "Both Passwords do not match. Please Enter Correctly" })
            }
        }
        else {
            res.redirect(changePassword, { errMsg: "User not found" })
        }
    } catch (error) {
        console.log(error)
    }
}

//exports
module.exports = {
    userRegister,
    verifyMail,
    login,
    dashboard,
    forgetPassword,
    changePassword
}