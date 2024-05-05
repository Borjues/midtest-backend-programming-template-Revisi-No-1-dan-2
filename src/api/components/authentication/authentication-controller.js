const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');

//nyimpen ke data berapa kali salahnya
const attemptsLog = {};

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    // if there are any other failed attempt
    const usedEmail = email.toLowerCase(); //email
    const failedAttempts = attemptsLog[usedEmail] || 0;
    if (failedAttempts >= 5) { //more than 5 means blocked
      const lastFailedTime = attemptsLog[`${usedEmail}_timestamp`] || 0;
      const currentTime = Date.now();
      const temporaryBlockedLogin = currentTime - lastFailedTime;
      const reEnterMinutes = Math.ceil((30 * 60 * 1000 - temporaryBlockedLogin) / (60 * 1000)); // Convert milliseconds to minutes

      if (temporaryBlockedLogin < 30 * 60 * 1000) {
        throw errorResponder(
          errorTypes.TOO_MANY_ATTEMPTS,
          `error 403 Forbidden: Too many failed login attempts. Wait ${reEnterMinutes} minutes.`
        );
      } else {
        //reset attempt after 30min max
        delete attemptsLog[usedEmail];
        delete attemptsLog[`${usedEmail}_timestamp`];
    }
  }

    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      attemptsLog[usedEmail] = failedAttempts + 1;
      attemptsLog[`${usedEmail}_timestamp`] = Date.now();
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Wrong email or password'
      );


    }

    // Reset failed login attempts if login is successful
    delete attemptsLog[usedEmail];
    delete attemptsLog[`${usedEmail}_timestamp`];

    return response.status(200).json({
      success_Login: true,
      message: 'Login successful',
      recently_failed_attempts: failedAttempts, // Adding attempts count to the response
    });
  } catch (error) {
    return next(error);
  }
}
module.exports = {
  login,
};