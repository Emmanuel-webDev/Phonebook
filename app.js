const express = require('express');

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs')

const jwt = require("jsonwebtoken");

const phone = require('./Model/PhoneBook')

const user = require('./Model/user')

const cookie = require('cookie-parser')


const app = express()

const JWT_SECRET = "qwwfdhfjhrtgryhtjtjtjntrjhgfuhrijfurhgufhrihfurufhehojdfrfnghng"

mongoose.connect('mongodb://127.0.0.1:27017/phonebook', {UseNewUrlParser: true}).then(()=>{

app.use(express.json());
app.use(cookie());
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}));

app.set("views", "UI")
app.set('view engine', 'ejs')

//homepage
app.get('/', (req,res)=>{
    res.status(200).render('signup')
})

//login page
app.get('/loginUser', (req, res)=>{
    res.status(200).render('Login')
})

//signup
app.post('/signUp', async (req, res)=>{
    const {Username, Email, password} = (req.body)

    if(!Username || !Email || !password){
        return res.send({message: 'Fill inputs'})
     }

    //passsword hashing
        const hashed = await bcrypt.hash(password, 12)
        req.body.password= hashed
    const newUser = new user({
        Username: req.body.Username,
        Email: req.body.Email,
        password: req.body.password
    })

    if(!(newUser.Username && newUser.Email && newUser.password)){
        return res.status(403).send({message: "user needs to signup"})
    }

    await newUser.save();
    res.redirect('/loginUser')
}) 

//Login
app.post('/Login', async(req, res)=>{
    const password = req.body.password;
    const Email = req.body.Email

    const existingUser = await user.findOne({Email: Email})
    if(!existingUser){
         res.redirect('/loginUser')
        return
      }

    const check = await bcrypt.compare(password, existingUser.password)
    if(!check){
        return res.redirect('/loginUser')
    }
       

  //Registering tokens
  const token = jwt.sign({id: existingUser._id, Email: existingUser.Email}, JWT_SECRET, {expiresIn: "3d"})
  if(!token){
    return res.redirect('/loginUser')
  }
  return res.cookie("access_token", token, {
    httpOnly: true,
    secure: false
 }).redirect('/Contacts');

})

//middleware for checking tokens
const authorization = (req, res, next)=>{
    const token = req.cookies.access_token
    if(!token){
        return res.status(403).send('<h1> Unauthorized activity </h1>');
    }
    try{
         const verify = jwt.verify(token, JWT_SECRET);
    }catch{
        return res.status(403).send({message:"Error: Forbideen"})
    }
   
    next()
    
}

//get Contacts
app.get('/Contacts', authorization,  async (req, res)=>{

    const contacts = await phone.find()
    
   //  const contacts = await phone.find();
    res.status(200).render('contacts', {contacts : contacts})
})

//createContact
app.get('/NewContact', authorization, (req, res)=>{
    res.status(200).render('create');
})

//create Contacts
app.post('/newContacts', authorization, async (req,res)=>{
    const newContact = new phone({
        Name: req.body.Name,
        Tel: req.body.Tel,
        created_at:new Date().toLocaleDateString()
    })
    await newContact.save();
    res.redirect('/Contacts')
})

app.get('/updates/:id', authorization, async (req,res)=>{
    const contacts = await phone.findById(req.params.id);
    res.render('update', {contact : contacts})
})

//updating Contact
app.post('/update/:id', authorization, async(req, res)=>{
const updateContact = await phone.findByIdAndUpdate({_id: req.params.id}, {
    Name: req.body.Name,
    Tel: req.body.Tel,
    created_at: new Date().toLocaleDateString()
})
res.status(200).redirect('/Contacts');
})

//Deleting
app.post('/del/:id', authorization, async (req, res)=>{
    const delContact = await phone.findByIdAndDelete(req.params.id);
    res.status(200).redirect('/Contacts')
})

//Logging users out
app.post('/logout', authorization, (req, res)=>{
 return res.clearCookie('access_token').redirect('/')
})

//searchbox
app.post('/getContacts', async (req, res)=>{
    const {Name} = req.body
    const payload = req.body.payload.trim();
    const search = await phone.find({Name: {$regex: new RegExp('^'+payload+'.*','i')}}).exec();

    res.send({payload: search})
})

app.get('/search', (req, res)=>{
    res.status(200).render('search')
})

app.listen(3030, ()=>{
    console.log("Server running on 127.0.0.1:3030")
})

})

