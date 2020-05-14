const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/User');
const {ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

User.updateOne({email: 'u1@gmail'}, {
  amount: 10
}, function(err, affected, resp) {
  console.log(resp);
 })

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login.ejs'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register.ejs'));

// Register
router.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register.ejs', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register.ejs', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });

        if (email.includes("@company", 1)) {
          newUser.amount = 100000
        }
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
}); 

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.post('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
});

router.get('/payments', ensureAuthenticated, (req, res) => {
  res.render('payments.ejs');
});

router.get('/transactions', ensureAuthenticated,(req, res) =>
  res.render('transactions.ejs', {
    history: req.user.history
  })
);

router.post('/payments', (req, res) => {
  // console.log(req.user.email + " fraierul")
  var {receiver, amount, payments_nr, freq} = req.body;
  let errors = [];
  var sender = req.user.email;

  if (!receiver || !amount) {
    errors.push({ msg: 'Please enter all fields' });
    res.redirect('/users/login');
    return;
  }
  
  if (amount < 0) {
    errors.push({ msg: 'Please insert positive value' });
    res.redirect('/users/login');
    return;
  }
  console.log("payments_nr " + payments_nr + " freq: " + freq);

  var timer = setInterval(function() {

      User.findOne({ email: receiver }).then(user => {
        if (!user) {
          errors.push({ msg: 'Email does not exist' });
        } else {
    
          User.findOne({email: receiver}, function(err, receiver_data) {
            if (err) {
              console.log("eroare" + err);
            }
            console.log(sender + "   " + amount);
            User.findOne({email: sender}, function(err, sender_data) {
              if (err) {
                console.log("eroare" + err);
              }
              if (sender_data.amount < amount) {
                errors.push({msg: 'Not enough money'});
              } else {
                var updated_amount = parseInt(amount) + receiver_data.amount
                console.log("Send " + amount);
    
                User.updateOne({email: receiver}, {
                  amount: updated_amount
                }, function(err, affected, resp) {
                  console.log(resp);
                })
    
                var to_subtract = sender_data.amount - parseInt(amount)
                console.log("Subtract " + amount)
                User.updateOne({email: sender}, {
                  amount: to_subtract
                }, function(err, affected, resp) {
                  console.log(resp);
                })
    
                var date = new Date();
                var sender_history = sender_data.history;
                var string_s = "Sent " + amount + "$ to " + receiver + " | " + date;
                sender_history.unshift(string_s);
                User.updateOne({email: sender}, {
                  history: sender_history
                }, function(err, affected, resp) {
                  console.log(resp);
                })
                console.log(string_s);
    
                var receiver_history = receiver_data.history;
                var string_r = "Received " + amount + "$ from " + sender + " | " + date; 
                receiver_history.unshift(string_r);
                User.updateOne({email: receiver}, {
                  history: receiver_history
                }, function(err, affected, resp) {
                  console.log(resp);
                })
                console.log(string_r);
              }
            });
    
          });
    
    
        }
      });

    payments_nr--;
    console.log("payments_nr " + payments_nr + " freq: " + freq);

    if (payments_nr < 1) {
      clearInterval(timer);
    }

    }, freq * 1000);

  res.redirect('/users/login');

});

router.get('/management', ensureAuthenticated, (req, res) => {
  res.render('management.ejs');
});

router.post('/management', ensureAuthenticated, (req, res) => {
  var { name, email, password, password2 } = req.body;
  let errors = [];
  const old_email = req.user.email;

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register.ejs', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) throw err;
        password = hash;
      });
    });

    console.log("1 new email: " + email + " new pass: " + password + " new username: " + name);
    User.findOne({email: email}, function(err, new_email_data) {
      if (new_email_data && new_email_data.email != old_email) {
        errors.push("this email already exists")
        console.log("this email already exists")
      } else {
        User.updateOne({email: old_email}, {
          email: email,
          name: name,
          password: password
        }, function(err, affected, resp) {
          console.log(resp);
        });
      }
    })

  }
  res.redirect('/users/login');
});


module.exports = router;
