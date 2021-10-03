/*
codeCollections  是在做 refactoring之前， 的混乱状态。

工具函数 ===》 util

原来自己就在写 restfulAPI （类似与 graphql api）   卧槽。 就是cloud functions  然后 返回一些数据。 好牛。


*/

const functions = require('firebase-functions')

const app = require('express')()

const { getAllScreams, postOneScream } = require('./handlers/screams')
const { signup, login } = require('./handlers/users')
const FBAuth = require('./util/FBAuth')

app.get('/screams', getAllScreams)
app.post('/scream', FBAuth, postOneScream)
app.post('/signup', signup)
app.post('/login', login)

// upload the user image

exports.api = functions.https.onRequest(app)
