if(process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

const users = [{
    id: '1606072990503',
    name: 'a',
    email: 'a@a',
    password: '$2b$10$kHrR4ExbuSKvC2GIw4nc0um8wvtMjryExhGjf5mDaYDJFDWMdwKvC'
  }]

app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', {name: req.user.name})
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs', {errormessage: ''})
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  //res.errorMessage = ''
  var user = users.find(user => user.email === req.body.email)

  if(user) {
    console.log('Same email')
    return res.render('register.ejs', { errormessage: 'Email is already in use'});
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
  console.log(users)
})

app.post('/changePassword', checkAuthenticated, async (req, res) => {
  console.log("Password changed")
  var user = users.find(user => user.name === req.user.name)
  const hashedPassword = await bcrypt.hash(req.body.newPassword, 10)
  user.password = hashedPassword
  res.render('index.ejs', {name: user.name, message: 'Password updated!'})
})

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if(req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if(req.isAuthenticated()) {
    return res.redirect('/')
  }

  next()
}

app.listen(process.env.PORT || 3000)
