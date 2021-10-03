/*
db.doc('/users')  ===== db.collection('users')


*/

// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions')

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin')
admin.initializeApp()

const express = require('express')
const app = express()

const db = admin.firestore()

/*
安装 package， 要到 Function 下面。


*/

/* 得到所有collection */

// firebase serve
// postman run http://localhost:5000/fullstackapp-273bf/us-central1/api/screams
// 因为是 app.get 所以用 post 请求的话，express 就自动报错了。
app.get('/screams', (req, res) => {
  admin
    .firestore()
    .collection('screams')
    .orderBy('createAt', 'desc')
    .get()
    .then((data) => {
      let screams = []
      data.forEach((doc) => {
        // 把数据改成一个obj
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createAt: doc.data().createAt,
        })
      })
      return res.json(screams)
    })
    .catch((err) => {
      console.error(err)
    })
})

/* 增加 */
app.post('/scream', (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createAt: new Date().toISOString(),
  }

  admin
    .firestore()
    .collection('screams')
    .add(newScream)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created with success` })
    })
    .catch((err) => {
      // 500 means server problem
      res.status(500).json({ error: 'something went wrong' })
      console.error(err)
    })
})

/*   SignUp */
/*
 先是判断 handle 是否重名， 再判断email 是否存在。

*/
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }
  // TODO: validate data
  //  I want save all the users in firestore
  let userToken, userId
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
})

//we want the request to be like this:  https://baseurl.com/api/
// onece someone request api, I will send app back
// region('europe-west1') 就是数据库的位置
exports.api = functions.https.onRequest(app)

/*
这是简单的用http, 我们可以用express。 看上面。

*/

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

// exports.helloWord = functions.https.onRequest((req, res) => {
//   res.send('jiba')
// })

// exports.getScreams = functions.https.onRequest((req, res) => {
//   admin.firestore().collection('screams').get().then((data) => {
//     let screams = []
//     data.forEach((doc) => {
//       screams.push(doc.data())
//     })
//     return res.json(screams)
//   }).catch((err) => console.error(err))
// })

// exports.createScream = functions.https.onRequest((req, res) => {
//   if(req.method !== 'POST') {
//     return res.status(400).json({error: 'Method not allowed'})
//   }
//   const newScream = {
//     body: req.body.body,
//     userHandle: req.body.userHandle,
//     createdAt: admin.firestore.Timestamp.fromDate(new Date())
//   }

//   admin.firestore().collection('screams').add(newScream).then((doc) => {
//     // the doc.id here 就是相当于  DVNS0FyC8SVjxg4awLCp,
//     // doc 相当于 一个整体的 newScream
//     res.json({message: `document ${doc.id} created successfully`})
//   }).catch((err) => {
//     res.status(500).json({error: 'something went wrong'})
//     console.log(err)
//   })
// })
