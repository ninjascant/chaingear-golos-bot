const http = require('http')
const golos = require('golos-js')
const createHandler = require('github-webhook-handler')
const Github = require('github-api-node')
const config = require('./config.json')
const jsonfile = require('jsonfile')
const _ = require('lodash')
const prms = require('./promisified.js')
const atob = require('atob')
const toml = require('toml')
const convert = require('./new_to_old.js')

const github = new Github({
  username: "goloschaingear",
  password: config.git_key,
  auth: "basic"
})
const username = "ninjascant",
    password = config.git_key1

const options = {
  headers: {
    'Authorization': "Basic " + new Buffer(username + ":" + password).toString("base64"),
    'User-Agent': 'ninjascant'
  }
}
const dataRepo = github.getRepo('goloschaingear', 'data')

const port = 8080
const path = '/'
const br = 'gh-pages'
const handler = createHandler({path: path, secret: config.secret})

http.createServer((req, res) => {
	handler(req, res, (err) => {
		res.statusCode = 404
		res.end('no such location')
	})
}).listen(port)

handler.on('error', err => {
	console.error('Handler error', err.message)
})
handler.on('push', event => {
  console.log('Push event')
  const commits = event.payload.commits.filter(commit => commit.added.length!==0 || commit.modified.length !== 0)
  console.log(commits[0].modified)
  if(commits.length === 0) return
  if(commits[0].modified.indexOf('chaingear.json')!==-1) {
    console.log('That was chaingear.json')
    return
  }
  const blobGetUrl = 'https://api.github.com/repos/cyberFund/chaingear/git/blobs/'
  const url = 'https://api.github.com/repos/cyberFund/chaingear/commits/'
  const promiseList = commits.map(commit => prms.apiReq((url + commit.id), options))
  Promise.all(promiseList)
    .then(commits => {
      const promiseList = commits.map(commit => {
        if(commit.commit.commiter==='GolosBot') {
          const projectName = commit.commit.message.split(/Add: /)[1]
          const url = 'https://api.github.com/repos/goloschaingear/data/contents/bot-list.json'
          apiReq(url, options)
            .then(list => {
              const projects = list.map(item => item.project)
              return golos.broadcast.vote(config.wif,
                'golos-chaingear',
                projects[n].author,
                projects[n].url.split('/')[2],
                100,
                (err, res) => console.log(err?err:'Upvoted!'))
              })
          .catch(error => console.log(error))
        }
        return commit.files.map(file=>{
          //if(file.status === 'modified' && file.filename !== 'chaingear') updated.push(file.filename)
          if(file.filename === 'chaingear.json') return null
          else return prms.apiReq(blobGetUrl+file.sha, options)
        }).filter(prom => prom !== null)
      }).reduce((prev, curr) => prev.concat(curr))
      return Promise.all(promiseList)
    })
  .then(blobs => {
    const files = blobs.map(blob => {
      let file = toml.parse(atob(blob.content))
      if(file.ico!==undefined) {
        console.log(file)
        return convert(file)
      }
      else return file
    })
    const updated = files.map(file => file.system)
    const chaingear = jsonfile.readFileSync('chaingear.json').filter(proj => updated.indexOf(proj.system)===-1)

    const n = chaingear.length
    const fiat = chaingear.slice(n-15)
    let crypto = chaingear.slice(0, n-15)
    crypto = crypto.concat(files)
    crypto = _.sortBy(crypto, ['system'])
    
    const newFile = crypto.concat(fiat)
    return jsonfile.writeFileSync('chaingear.json', newFile, {spaces: 4})
  })
  .then(none => {
      return prms.getRef('cyberFund', 'chaingear', br)
    })
    .then(res => {
      const sha = res.data.object.sha
      return prms.getTree('cyberFund', 'chaingear', sha)
    })
    .then(res => {
      const sha = res.data.tree.filter(item => item.path==='chaingear.json')[0].sha
      return prms.getBlob('cyberFund', 'chaingear', sha)
    })
    .then(res => {
      const sha = res.data.sha
      const fileStr = JSON.stringify(jsonfile.readFileSync('chaingear.json', 'utf-8'), null, 4)
      return prms.updateFile('cyberFund', 'chaingear', 'chaingear.json', 'Commit from constructor.js', fileStr, sha, br)
    })
    .then(none => console.log(`File chaingear.json constructed and commited`))
  .catch(error=>console.log(error))
})
