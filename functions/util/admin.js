const admin = require('firebase-admin')

admin.initializeApp({
  serviceAccountId:
    'firebase-adminsdk-5nrmv@fullstackapp-273bf.iam.gserviceaccount.com',
})
const db = admin.firestore()

module.exports = { admin, db }
