/*
db.doc('/users')  ===== db.collection('users')

res.json()   VS  return res.json
The return is used to stop execution. It is often used to do some form of early return based on a condition.

有时候先 deploy， 再看错误的信息。 token 没 permission 要先deploy 一下。不能请求http://localhost:5000/fullstackapp-273bf/us-central1/api/login
因为这是本地的， 没有权限。

token of '5@5.com':

'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL2lkZW50aXR5dG9vbGtpdC5nb29nbGVhcGlzLmNvbS9nb29nbGUuaWRlbnRpdHkuaWRlbnRpdHl0b29sa2l0LnYxLklkZW50aXR5VG9vbGtpdCIsImlhdCI6MTYzMzI2ODA2MywiZXhwIjoxNjMzMjcxNjYzLCJpc3MiOiJmaXJlYmFzZS1hZG1pbnNkay01bnJtdkBmdWxsc3RhY2thcHAtMjczYmYuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJzdWIiOiJmaXJlYmFzZS1hZG1pbnNkay01bnJtdkBmdWxsc3RhY2thcHAtMjczYmYuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJ1aWQiOiJmSk1hSHVBQWN3ZlU3aVVlT1ZpbDU5WGJodkgyIn0.wsa9bFfLFLmUrgCcuLIswf8u_IXTDxunHmm1sGC5t3EG-Mc60-ql7L5S5m4kr7bqrWANP5Y8aBoRKdbr5spaBVJTyVob1axoA0AmuO2f7dOsGniiKjMF3pReh4hmlwXSH8_uW1JKXHeLqCaZ23MMJR4kfeUICXfMfRynwzwVBlIjWyVMALh3rWJ4ymmyXRGeDFldC_5ZS76lWSFOO4RoiJEs318O7JJlBKTTHDlFXqsswR0ezI1tzMO7Jh5ltFfbc-pnCHhpMNVDWUv_IrwNBtEWInQ0tFGMQXLI3kSlCK0of6rxTDc0iHFScBcDEJl0xfReJ3QqEHMmIrcTbw9p2w'


*/

// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions')

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin')
// serviceAccountId is used for getCustomizedToken()
admin.initializeApp({
  serviceAccountId:
    'firebase-adminsdk-5nrmv@fullstackapp-273bf.iam.gserviceaccount.com',
})

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
// 但是再增加到db之前， 要验证token（client 发送一个token），没有token的话，就无法add。 这里的token 写在postman的header 里面。

const FBAuth = (req, res, next) => {
  let idToken
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    // 因为header里面写的是： Bearer ndashfkamahgck.....    中间一个空格。
    idToken = req.headers.authorization.split('Bearer ')[1]
  } else {
    console.error('No taken found or Token in headers wrong written')
    return res.status(403).json({ error: 'fuck Unauthorized' })
  }

  // 有了idToken之后
  admin
    .auth()
    // 首先需要在client端登陆。要是不登陆的话，server就不存 token， token比较时候， 自然对不上。
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      // add key 'user' to req
      req.user = decodedToken
      console.log(decodedToken)
      return db
        .collection('users')
        .where('uid', '==', req.user.uid)
        .limit(1) // array with only one item
        .get()
    })
    .then((data) => {
      // add key 'handle' to req.user
      console.log(data)
      req.user.handle = data.docs[0].data().handle
      return next() // 在修饰完 req 之后 接着往下走。
    })
    .catch((err) => {
      console.error('Error while verifying token', err)
      return res.status(403).json(err)
    })
}

// FBAuth是中间件， 完事之后之情后面的（req， res），FBAuth会给一个新的req
app.post('/scream', FBAuth, (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
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

const isEmail = (email) => {
  const regEx =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  if (email.match(regEx)) return true
  else return false
}

const isEmpty = (string) => {
  if (string.trim() === '') return true
  else return false
}

app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  }
  // TODO: validate data
  // put all the errors in an {}

  let errors = {}
  if (isEmpty(newUser.email)) {
    errors.email = 'Email must not be empty'
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Email is not valid'
  }

  if (isEmpty(newUser.password)) errors.password = 'password must not be empty'
  if (newUser.password !== newUser.confirmPassword)
    errors.password = 'password does not match'
  if (isEmpty(newUser.handle)) errors.handle = 'handle should not be empty'

  // now check if the errors are empty
  if (Object.keys(errors).length > 0) {
    console.log(errors)
    res.status(400).json(errors)
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
})

/* Login */

app.post('/login', async (req, res) => {
  try {
    const user = {
      email: req.body.email,
    }

    let errors = {}
    if (isEmpty(user.email)) errors.email = 'email can not be empty'
    if (!isEmail(user.email)) errors.email = 'email is not valid'
    // if (isEmpty(user.password)) errors.password = 'password can not be empty'

    if (Object.keys(errors).length > 0) return res.status(400).json(errors)

    const theUser = await admin.auth().getUserByEmail(user.email)
    //  create the token and give back to client, so client could use signInWithCustomToken()
    const customToken = await admin.auth().createCustomToken(theUser.uid)
    return res.status(200).send(customToken)
  } catch (error) {
    return res.status(404).json(error)
  }
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
