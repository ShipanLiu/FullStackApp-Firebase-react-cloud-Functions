const { admin, db } = require('./admin')

module.exports = (req, res, next) => {
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
