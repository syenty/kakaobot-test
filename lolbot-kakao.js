const express = require('express')
const app = express()
const logger = require('morgan')
const bodyParser = require('body-parser')

// npm install request
const request = require('request')
// npm install urlencode
const urlencode = require('urlencode')

const keys = require("./keys.json")
const autoMessage = require("./auto-message.json")

const champions = require("./json-lol/champions.json")
const queue = require("./json-lol/queues.json")

const example = require("./example.json")

const info = champions.data
const posiotionEnName = {탑:"TOP", 정글:"JUNGLE", 미드:"MID", 바텀:"ADC", 원딜:"ADC", 서포터:"SUPPORT", 서폿:"SUPPORT"}

const getChampionName = id => {
    for (const [enName, obj] of Object.entries(info)) {
        if(obj.key === ""+id){
            return obj.name
        }
    }
}

const getChampionEnName = krName => {
    for (const [enName, obj] of Object.entries(info)) {
        if(obj.name === krName){
            return enName
        }
    }
}

const getChampionId = name => {
    for (const [enName, obj] of Object.entries(info)) {
        if(obj.name === name){
            return obj.key
        }
    }
}

const getQueueType = queueId => {
    for(const item of queue){
        if(queueId === item.queueId){
            return item.description
        }
    }
}

const getQueueId = queueName => {
    for(const item of queue){
        if(queueName === item.description){
            return item.queueId
        }
    }
}

// 딜량 등수 (flag : true 전체, false 팀 내)
// 공동 딜량에 대한 처리 미구현
const getDealtRank = (matchDetail, participantId, flag) => {
    let obj = {}
    let arr = []

    const teamId = matchDetail.participants[matchDetail.participants.findIndex(obj => obj.participantId === participantId)].teamId
    matchDetail.participants.forEach((item, idx) => {
        if(flag || item.teamId === teamId){
            obj = {}
            obj.id = item.participantId
            obj.deal = item.stats.totalDamageDealtToChampions
            arr[idx] = obj
        }   
    })
    arr.sort(function (a,b){ 
        return b.deal - a.deal
    })
    
    //console.log(arr,participantId)

    return arr.findIndex(obj => obj.id === participantId)+1
}

const elapsedTimeFormatter = ctime => {
    const stime = parseInt(ctime/1000)
    return `${parseInt(stime/60)}:${stime%60 < 10 ? "0"+stime%60 : stime%60}`
}





const apiRouter = express.Router()

app.use(logger('dev', {}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.use('/api', apiRouter)


const responseBody = {
    version: "2.0",
    template: {
        outputs: [
                {
                simpleText: {
                    text: ""
                }
            }
        ]
    }
}

apiRouter.post('/getTier', function(req, res) {

    const name = example.action.params.lol_name
    console.log(res)

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
                        responseBody.template.outputs[0].simpleText.text = autoMessage["only-rank"]
                        res.status(200).send(responseBody)
                        
                    }

                    league_obj.forEach(item => {
                        if(item.queueType === "RANKED_SOLO_5x5"){

                            tmpMsg += `소환사명 : ${item.summonerName}\n`
                            tmpMsg += `티어 : ${item.tier} ${item.rank} ${item.leaguePoints}pt\n`
                            tmpMsg += `${item.wins}승 ${item.losses}패 (${Math.round(100*item.wins/(item.wins+item.losses))}%)`

                            responseBody.template.outputs[0].simpleText.text = tmpMsg
                            res.status(200).send(responseBody)

                        }
                    })

                }else{
                    
                    console.log("티어 => " + autoMessage["non-info"])

                    responseBody.template.outputs[0].simpleText.text = autoMessage["non-info"]
                    res.status(200).send(responseBody)

                }

            })

        }

    })
    
})

app.listen(59049,function(){
  console.log('Connect 59049 port!')
})