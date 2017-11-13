const http = require('http')
const golos = require('golos-js')
const createHandler = require('github-webhook-handler')
const Github = require('github-api-node')
const config = require('../config.json')
const jsonfile = require('jsonfile')
const _ = require('lodash')
const prms = require('./promisified.js')

const github = new Github({
  username: "goloschaingear",
  password: config.git_key,
  auth: "basic"
})
const username = "ninjascant",
    password = "djpvj;yjcnm1;a"

const options = {
  headers: {
    'Authorization': "Basic " + new Buffer(username + ":" + password).toString("base64"),
    'User-Agent': 'ninjascant'
  }
}
const dataRepo = github.getRepo('goloschaingear', 'data')

const port = 8080
const path = '/'
const handler = createHandler({path: path, secret: config.secret})

http.createServer((req, res) => {
	handler(req, res, (err) => {
		res.statusCode = 404
		res.end('no such location')
	})
}).listen(port)

handler.on('error', err => {
	console.error('Error', err.message)
})
handler.on('push', event => {
  //console.log(event)
  const commits = event.payload.commits
  const blobGetUrl = 'https://api.github.com/repos/ninjascant/golos-academy/git/blobs/'
  let updated = []

  const promiseList = commits.map((commit) => {
    if(commit.commit.commiter==='GolosBot') {
      const projectName = commit.commit.message.split(/Add: /)[1]
      const url = 'https://api.github.com/repos/goloschaingear/data/contents/bot-list.json'
      apiReq(url, options)
        .then(list => {
          const projects = list.map(item => item.project)
          return golos.broadcast.vote(config.wif,
            'cyberanalytics',
            projects[n].author,
            projects[n].url.split('/')[2],
            100,
            (err, res) => console.log(err?err:'Upvoted!'))
          })
      .catch(error => console.log(error))
    }
    return commit.files.map(file=>{
      if(file.status === 'modified' && file.filename !== 'chaingear') updated.push(file.filename)
      if(file.filename === 'chaingear.json') return null
      else return apiReq(blobGetUrl+file.sha)
    }).filter(prom => prom !== null)
  }).reduce((prev, curr) => prev.concat(curr))
  Promise.all(promiseList)
    .then(blobs => {
      const files = blobs.map(blob => JSON.parse(Buffer.from(blob.content, 'base64').toString('utf8')))
      const updated = files.map(file => file.system)
      const chaingear = jsonfile.readFileSync('chaingear.json').filter(proj => updated.indexOf(proj.system)!==-1)
      const n = chaingear.length
      const fiat = chaingear.slice(n-15)
      let crypto = chaingear.slice(0, n-15)
      crypto = crypto.concat(files)
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
    .catch(error=>console.error(error))
})
