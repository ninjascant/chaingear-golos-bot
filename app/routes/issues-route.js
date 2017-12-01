const config = require('../../config.json');
const githubMiddleware = require('github-webhook-middleware')({
  secret: config.git_secret
})

module.exports = (app) => {
  app.post('/issues', githubMiddleware, (req, res) => {
    console.log(req.body);
  })
}
