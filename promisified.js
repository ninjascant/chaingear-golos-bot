const request = require('request')

const readFile = (repository) => {
  return new Promise((resolve, reject) => {
    repository.read('master', 'bot-list.json', (err, res) => err?reject(err):resolve(res))
  })
}
const apiReq = (url, options) => {
  return new Promise((resolve, reject) => {
    request(url, options,
      (err, response, body) => err?reject(err):resolve(JSON.parse(body)))
  })
}
const updateFile = (owner, repo, path, message, content, sha, branch) => {
  return new Promise((resolve, reject) => {
    github.repos.updateFile({
          owner: owner,
          repo: repo,
          path: path,
          message: message,
          content: base64.encode(utf8.encode(content)), //
          sha: sha,
          branch: branch
      }, (err, res) => err?reject(err):resolve(res))
  })
}
module.exports = {
  readFile: readFile,
  apiReq: apiReq
}
