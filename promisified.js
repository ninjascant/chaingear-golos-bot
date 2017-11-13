const request = require('request')
const GitHubApi = require("github")
const config = require('../config.json')
const base64 = require('base-64')
const utf8 = require('utf8')

const github = new GitHubApi({
    debug: false
  })

github.authenticate({
  type: "basic",
  username: "ninjascant",
  password: config.git_key
})

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
const apiPostReq = (url) => {
  return new Promise((resolve, reject) => {
    request.post(url, options,
      (err, response, body) => err?reject(err):resolve(JSON.parse(body)))
  })
}
const br = 'confideal'
  const getRef = (owner, repo, ref) => {
    return new Promise((resolve, reject) => {
      github.gitdata.getReference({owner: 'ninjascant', repo: 'chaingear', ref: `heads/${br}`}, 
        (err, res) => err?reject(err):resolve(res))
    })
  }
  const getTree = (owner, repo, sha) => {
    return new Promise((resolve, reject) => {
      github.gitdata.getTree({owner: 'ninjascant', repo: 'chaingear', sha: sha}, 
        (err, res) => err?reject(err):resolve(res))
    })
  }
  const getBlob = (owner, repo, sha) => {
    return new Promise((resolve, reject) => {
      github.gitdata.getBlob({owner: 'ninjascant', repo: 'chaingear', sha: sha}, 
        (err, res) => err?reject(err):resolve(res))
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
  apiReq: apiReq,
  updateFile: updateFile,
  getRef: getRef,
  getTree: getTree,
  getBlob: getBlob
}
