/*
这里管理着user 登陆等行为


*/

const { db, admin } = require('../util/admin')
const { validateSignUpData, validateLoginData } = require('../util/validators')

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }
  // validate data
  const { errors, valid } = validateSignUpData(newUser)
  if (!valid) {
    return res.status(404).json(errors)
  }

  //  I want save all the users in firestore
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        // if this user already exists
        return res.status(400).json({ handle: 'this handle is already taken' })
      } else {
        // continue to create the user and save it in the Firestore manully
        admin
          .auth()
          .createUser({
            email: newUser.email,
            password: newUser.password,
          })
          .then((userRecord) => {
            console.log(userRecord)
            const saveUserDetailsToDB = {
              handle: newUser.handle,
              email: newUser.email,
              createAt: new Date().toISOString(),
              uid: userRecord.uid,
            }
            return db.doc(`/users/${newUser.handle}`).set(saveUserDetailsToDB)
          })
          .then(() => {
            res.status(201).json({ message: 'save in db' })
          })
          .catch((err) => {
            console.log(err)
            if (err.code === 'auth/email-already-exists') {
              res.status(400).json({ email: 'Email is already in use' })
            } else {
              res.status(500).json({ error: err.code })
            }
          })
      }
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.login = async (req, res) => {
  try {
    const user = {
      email: req.body.email,
    }

    const { errors, valid } = validateLoginData(user)
    if (!valid) {
      return res.status(404).json(errors)
    }

    const theUser = await admin.auth().getUserByEmail(user.email)
    //  create the token and give back to client, so client could use signInWithCustomToken()
    const customToken = await admin.auth().createCustomToken(theUser.uid)
    return res.status(200).send(customToken)
  } catch (error) {
    return res.status(404).json(error)
  }
}
