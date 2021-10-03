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

exports.validateSignUpData = (data) => {
  let errors = {}
  if (isEmpty(data.email)) {
    errors.email = 'Email must not be empty'
  } else if (!isEmail(data.email)) {
    errors.email = 'Email is not valid'
  }

  if (isEmpty(data.password)) errors.password = 'password must not be empty'
  if (data.password !== data.confirmPassword)
    errors.password = 'password does not match'
  if (isEmpty(data.handle)) errors.handle = 'handle should not be empty'

  // now check if the errors are empty
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  }
}

exports.validateLoginData = () => {
  let errors = {}
  if (isEmpty(data.email)) {
    errors.email = 'Email must not be empty'
  } else if (!isEmail(data.email)) {
    errors.email = 'Email is not valid'
  }

  // if (isEmpty(data.password)) errors.password = 'password must not be empty'

  // now check if the errors are empty
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  }
}
