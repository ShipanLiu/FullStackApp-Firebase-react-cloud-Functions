/*
  这里是 screams 下的数据管理


*/

const { db } = require('../util/admin')

exports.getAllScreams = (req, res) => {
  db.collection('screams')
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
}

exports.postOneScream = (req, res) => {
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
}
