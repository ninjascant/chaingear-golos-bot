const Github = require('github-api-node')
const GitHubApi = require("github")
const base64 = require('base-64')
const utf8 = require('utf8')
const act = require('./construct.js')
const glob = require('glob')
const fs = require('fs')
const jsonfile = require('jsonfile')
const toml = require('toml')
const _ = require('lodash')
const config = require('../config.json')

const construct_json = () => {
  const github = new GitHubApi({
    debug: false
  })

  github.authenticate({
    type: "basic",
    username: "ninjascant",
    password: config.key
  })
  const github1 = new Github({
    username: "ninjascant",
    password: config.key, 
    auth: "basic"
  })
  const repo = github1.getRepo('ninjascant', 'chaingear')
  const cfrepo = github1.getRepo('cyberfund', 'chaingear')
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
  const getContent = (repository, branch, path) => {
    return new Promise((resolve, reject) => {
      repository.contents(branch, path, (err, contents) => err?reject(err):resolve(contents))
    })
  }
  const readFile = (repository, branch, filePath) => {
    return new Promise((resolve, reject) => {
      repository.read(branch, filePath, (err, res) => err?reject(err):resolve({res: res, path: filePath}))
    })
  }
  let newFiles = []
  let cgSha = ''
  getContent(cfrepo, 'gh-pages', 'sources')
    .then(content => {
      const available = glob.sync('*', {cwd: '../sources'}).map(dir => `sources/${dir}`)
      const paths = content.map(item => item.path).filter(path => available.indexOf(path)===-1)
      const promiseList = paths.map(path => getContent(cfrepo, 'gh-pages', path))
      return Promise.all(promiseList)
    }) 
    .then(results => {
      console.log('Files list collected')
      const filePaths = results.map(res => res[0].path)
      console.log(filePaths)
      const promiseList = filePaths.map(path => readFile(cfrepo, 'gh-pages', path))
      return Promise.all(promiseList)
    })
    .then(files => {
      files.forEach(file => {
        fs.mkdirSync('../' + file.path.split('/').splice(0,2).join('/'))
        fs.writeFileSync('../' + file.path, file.res)
      })
      return files 
    })
    .then(none => {
      return getRef('cyberfund', 'chaingear', 'gh-pages')
    })
    .then(res => {
      const sha = res.data.object.sha
      return getTree('cyberfund', 'chaingear', sha)
    })
    .then(res => {
      const sha = res.data.tree.filter(item => item.path==='chaingear.json')[0].sha
      return getBlob('cyberfund', 'chaingear', sha)
    })
    .then(data => {
      const chaingear = JSON.parse(utf8.decode(base64.decode(data.data.content)))
      cgSha = data.meta.sha
      const n = chaingear.length
      const fiat = chaingear.slice(n-15)
      let crypto = chaingear.slice(0, n-15)
      const add = newFiles.map(file => toml.parse(file))
      crypto = crypto.concat(add)
      crypto = _.sortBy(crypto, ['system'])
      const newFile = crypto.concat(fiat)
      return jsonfile.writeFileSync('chaingear.json', newFile)
    })
    .then(none => {
      return getRef('ninjascant', 'chaingear', br)
    })
    .then(res => {
      const sha = res.data.object.sha
      return getTree('ninjascant', 'chaingear', sha)
    })
    .then(res => {
      const sha = res.data.tree.filter(item => item.path==='chaingear.json')[0].sha
      return getBlob('ninjascant', 'chaingear', sha)
    })
    .then(res => {
      const sha = res.data.sha
      const fileStr = JSON.stringify(jsonfile.readFileSync('chaingear.json', 'utf-8'), null, 4)
      return updateFile('ninjascant', 'chaingear', 'chaingear.json', 'Commit from constructor.js', fileStr, sha, br)
    })
    .then(none => console.log(`File chaingear.json constructed and commited`))
    .catch(error => console.log(error))
  }

module.exports = construct_json
