const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/User');
const { forwardAuthenticated } = require('../config/auth');

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

router.get('/payments', (req, res) => {
  res.render('payments.ejs');
});

router.get('/transactions', (req, res) => {
  res.render('transactions.ejs');
});

router.post('/payments', (req, res) => {
  // console.log(req.user.email + " fraierul")
  var {receiver, amount} = req.body;
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

          }
        });

      });


    }
    res.redirect('/users/login');
  });

})

module.exports = router;
