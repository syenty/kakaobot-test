const express = require('express')
const app = express()
const logger = require('morgan')
const bodyParser = require('body-parser')

// npm install request
const request = require('request')
// npm install urlencode
const urlencode = require('urlencode')

// require util class
const kakaoEmbed = require('./lib/kakaoEmbed')
const convertUtil = require('./lib/convertUtil')





let tmpMsg
let content

const apiRouter = express.Router()

app.use(logger('dev', {}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.use('/api', apiRouter)

apiRouter.post('/getTier', function(req, res) {

    const name = req.body.action.params.lol_name
    
    if(typeof name === "undefined"){

        console.log("티어 => " + autoMessage["bad-input"])

        content = new kakaoEmbed
        content.addText(autoMessage["bad-input"])
        res.status(200).send(content.output())
        return
        
    }

    request(`${keys.riotUrl}/summoner/v4/summoners/by-name/${urlencode(name)}?api_key=${keys.riotAPI}`, (error, response, body) => {

        if(error) throw error

        // 정상적인 입력시
        if(response.statusCode === 200){

            const summoner_obj = JSON.parse(body)

            const id = summoner_obj["id"]
            const accountId = summoner_obj["accountId"]

            request(`${keys.riotUrl}/league/v4/entries/by-summoner/${id}?api_key=${keys.riotAPI}`, (error, response, body) => {

                if(error) throw error

                if(response.statusCode === 200){

                    const league_obj = JSON.parse(body)

                    if(league_obj.findIndex(obj => obj.queueType === "RANKED_SOLO_5x5") === -1){

                        console.log("티어 => " + autoMessage["only-rank"])

                        content = new kakaoEmbed
                        content.addText(autoMessage["only-rank"])
                        res.status(200).send(content.output())
                        return
                        
                    }

                    league_obj.forEach(item => {
                        if(item.queueType === "RANKED_SOLO_5x5"){
                            
                            tmpMsg = ""
                            tmpMsg += `소환사명 : ${item.summonerName}\n`
                            tmpMsg += `티어 : ${item.tier} ${item.rank} ${item.leaguePoints}pt\n`
                            tmpMsg += `전적 : ${item.wins}승 ${item.losses}패 (${Math.round(100*item.wins/(item.wins+item.losses))}%)`

                            content = new kakaoEmbed

                            // content.addText(tmpMsg)
                            // res.status(200).send(content.output())

                            content.addBasicCard()
                            .setCardTitle(item.summonerName)
                            .setCardDescription(`${item.tier} ${item.rank} ${item.leaguePoints}pt\n${item.wins}승 ${item.losses}패 (${Math.round(100*item.wins/(item.wins+item.losses))}%)`)
                            .setCardThumbnail(`./images-lol/ranked-emblems/emblem_${item.tier.toLowerCase()}.png`)
                            res.status(200).send(content.output())
                            return

                        }
                    })

                }else{
                    
                    console.log("티어 => " + autoMessage["non-info"])

                    content = new kakaoEmbed
                    content.addText(autoMessage["non-info"])
                    res.status(200).send(content.output())
                    return

                }

            })

        }else{

            console.log("티어 => " + autoMessage["bad-input"])

            content = new kakaoEmbed
            content.addText(autoMessage["bad-input"])
            res.status(200).send(content.output())
        }

    })
    
})

app.listen(59049,function(){
  console.log('Connect 59049 port!')
})