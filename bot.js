const golos = require('golos-js')
const Github = require('github-api-node')
const config = require('./config.json')

const github = new Github({
	username: "goloschaingear",
	password: config.git_key,
	auth: "basic"
})

const baseRepo = github.getRepo('cyberfund', 'chaingear')
const repo = github.getRepo('goloschaingear', 'chaingear')
const dataRepo = github.getRepo('goloschaingear', 'data')

const options = {
	author: {name: 'GolosBot', email: 'echo.from@yandex.ru'},
	committer: {name: 'GolosBot', email: 'echo.from@yandex.ru'},
	encode: true
}

let lastPost = {}

const getBranches = (repository) => {
	return new Promise((resolve, reject) => {
		repository.listBranches((err, branches) => err?reject(err):resolve(branches))
	})
}
const createBranch = (repository, link) => {
	return new Promise((resolve, reject) => {
		repository.branch('from-golos', link, err => err?reject(err):resolve(link))
	})
}
const writeOrUpdate = (repository, branch, link, file, text) => {
	return new Promise((resolve, reject)=> {
		repository.write(branch, 
			file, 
			text, 
			`Commit from golosBot. Add: ${link}`, 
			options, 
			err => err?reject(err):resolve(`File ${link}.toml created`))
	})
}
const readFile = (repository) => {
	return new Promise((resolve, reject) => {
		repository.read('master', 'bot-list.json', (err, res) => err?reject(err):resolve(res))
	})
}
const createPullRequest = (base, pullReq) => {
	return new Promise((resolve, reject) => {
		base.createPullRequest(pullReq, (err, res) => err?reject(err):resolve(res))
	})
}

const main = () => {
	golos.api.getDiscussionsByCreated({"select_tags":['ico-data'], "limit":10}, (err, res)=>err?console.log(err):res)
		.then(posts=>{
			
			const meta = JSON.parse(posts[0].json_metadata)
			if(posts[0].id!==lastPost.id && meta.format==='markdown') {
				const link = posts[0].title.replace(/[\W]/g, '')
				const file = `sources/${link}/${link}.toml`
				console.log('New post!')

				getBranches(repo)
					.then(branches => branches.indexOf(link)===-1?createBranch(repo, link):link)
					.then(branch => writeOrUpdate(repo, link, link, file, posts[0].body))
					.then(fileRes => {
						console.log(fileRes)
						const pull = {
							title: `Add: ${link}`,
							body: 'Pull request from chaingear-golos-bot',
							base: 'gh-pages',
							head: `goloschaingear:${link}`
						}
						return createPullRequest(baseRepo, pull)
					})
					.then(res => {
						//console.log(res)
					    return golos.broadcast.comment(config.wif1, 
					    		posts[0].author, 
								posts[0].permlink, 
								'ninjas', 
								`re-cyberanalytics-${posts[0].permlink}-${Math.floor(Math.random() * (1000000 - 1) + 1)}`, 
								'', 
								'Thank you for submitting your application for listing on cyber•Fund ICO Radar.', 
								'', 
								(err, result) => err?console.log(err):result
								)
					})
					.then(none => {
						return readFile(dataRepo)
					})
					.then(list => {
						const tmp = {
							project: link,
							author: posts[0].author,
							url: posts[0].url,
							created: posts[0].created,
							timestamp: new Date().toISOString()
						}
						list.push(tmp)
						return writeOrUpdate(dataRepo, 'master', 'bot-list', 'bot-list.json', JSON.stringify(list, null, 4))
					})
					.then(res=>{
						console.log(res)
						return
					})
					.catch(error=>console.log('Err', error))
			}
			lastPost.id = posts[0].id
			lastPost.url = posts[0].url
			lastPost.meta = JSON.parse(posts[0].json_metadata)
		})
}

golos.api.getDiscussionsByCreated({"select_tags":['ico-data'], "limit":10}, (err, res)=>err?console.log(err):res)
    .then(posts=>{
    	lastPost.id = posts[0].id
    	console.log('Listen for new posts')
    	setInterval(main, 1000)
    })
