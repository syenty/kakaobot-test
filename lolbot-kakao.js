const express = require('express')
const app = express()
const logger = require('morgan')
const bodyParser = require('body-parser')

// npm install request
const request = require('request')
// npm install urlencode
const urlencode = require('urlencode')

// require util json
const keys = require("./keys.json")
const autoMessage = require("./auto-message.json")

const emblems = require("./json-lol/emblems.json")

// require util class
const kakaoEmbed = require('./lib/kakaoEmbed')
const ConvertUtil = require('./lib/convertUtil')
const convertUtil = new ConvertUtil

let tmpMsg
let carouselObj
let carouselItemObj
let content

const apiRouter = express.Router()

app.use(logger('dev', {}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.use('/api', apiRouter)

apiRouter.post('/guide', function(req, res) {

    content = new kakaoEmbed

    content.addText("원하는 기능을 선택해주세요")
    .addQuickReplies("티어 검색",{action: "message", messageText: "티어"})
    .addQuickReplies("유저 관전",{action: "message", messageText: "관전"})
    .addQuickReplies("전적 검색",{action: "message", messageText: "전적"})

    res.status(200).send(content.output())
    return

})

apiRouter.post('/fail', function(req, res) {

    content = new kakaoEmbed

    content.addText("현재 지원되는 기능들입니다")
    .addQuickReplies("티어 검색",{action: "message", messageText: "티어"})
    .addQuickReplies("유저 관전",{action: "message", messageText: "관전"})
    .addQuickReplies("전적 검색",{action: "message", messageText: "전적"})

    res.status(200).send(content.output())
    return

})

apiRouter.post('/getResult', function(req, res) {

    console.log(req.body)

    content = new kakaoEmbed

    content.addText("테스트 진행중")

    res.status(200).send(content.output())
    return

})

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
                            .setCardThumbnail(emblems[`${item.tier.toLowerCase()}`])
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

apiRouter.post('/getSpectator', function(req, res) {

    const name = req.body.action.params.lol_name
    
    if(typeof name === "undefined"){

        console.log("관전 => " + autoMessage["bad-input"])

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
            
            request(`${keys.riotUrl}/spectator/v4/active-games/by-summoner/${id}?api_key=${keys.riotAPI}`, (error, response, body) => {

                if(error) throw error

                if(response.statusCode === 200){

                    const spectator_obj = JSON.parse(body)

                    let blue_obj = {teamId:100,isAlly:false,teamArr:[]}
                    let red_obj = {teamId:200,isAlly:false,teamArr:[]}

                    tmpMsg += `${convertUtil.getQueueType(spectator_obj.gameQueueConfigId)} ${convertUtil.elapsedTimeFormatter(new Date().getTime()-spectator_obj.gameStartTime)} 진행중\n`

                    spectator_obj.participants.forEach(item => {
                        if(item.teamId === 100){   
                            blue_obj.teamArr.push(`${item.summonerName} (${convertUtil.getChampionName(item.championId)}) ${item.kill}`)
                        }else if(item.teamId === 200){
                            red_obj.teamArr.push(`${item.summonerName} (${convertUtil.getChampionName(item.championId)})`)
                        }
                        if(item.summonerId === id) {
                            if(item.teamId===100){
                                blue_obj.isAlly = true
                            }else{
                                red_obj.isAlly = true
                            }
                        }
                    })

                    tmpMsg += "같은 팀\n"
                    const allies = blue_obj.isAlly ? blue_obj : red_obj
                    allies.teamArr.forEach(item => {
                        tmpMsg+=`    ${item}\n`
                    })
                    tmpMsg += "상대 팀\n"
                    const enemies = !blue_obj.isAlly ? blue_obj : red_obj
                    enemies.teamArr.forEach(item => {
                        tmpMsg+=`    ${item}\n`
                    })

                    content = new kakaoEmbed
                    content.addText(tmpMsg)
                    res.status(200).send(content.output())
                    return

                }else{

                    console.log("관전 => " + autoMessage["non-info"])

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
            return

        }

    })
    
})

apiRouter.post('/getRecord', function(req, res) {

    let objectStr = req.body.action.params.lol_objectStr
    objectStr = objectStr.replace(/ +/g, " ")

    const objectArr = objectStr.split(" ")

    if(objectArr.length === 0 || objectArr.length > 3){

        console.log("전적. 공백 에러 => " + autoMessage["bad-input"])

        content = new kakaoEmbed
        content.addText(autoMessage["bad-input"])
        res.status(200).send(content.output())
        return

    }else{

        let name
        let param1 // 챔피언 or 큐타입
        let param2 // 큐타입

        if(objectArr.length >= 1){
            name=objectArr[0]
        }
        if(objectArr.length >= 2){
            param1=objectArr[1]
        }
        if(objectArr.length === 3){
            param2=objectArr[2]
        }

        carouselObj = {}
        carouselObj.type = "basicCard"
        carouselObj.items = []
    
        request(`${keys.riotUrl}/summoner/v4/summoners/by-name/${urlencode(name)}?api_key=${keys.riotAPI}`, (error, response, body) => {
    
            if(error) throw error
    
            // 정상적인 입력시
            if(response.statusCode === 200){
    
                const summoner_obj = JSON.parse(body)
    
                const id = summoner_obj["id"]
                const accountId = summoner_obj["accountId"]

                let requestUrl

                if(objectArr.length === 1){

                    // 닉네임만 입력시
                    requestUrl = `${keys.riotUrl}/match/v4/matchlists/by-account/${accountId}?endIndex=20&beginIndex=0&api_key=${keys.riotAPI}`
        
                }else if(objectArr.length === 2){

                    // 닉네임 + (큐타입 or 챔피언명) 입력시
                    if(typeof param1 !== "undefined" && (param1 === "솔랭" || param1 === "일반" || param1 === "자랭" || param1 === "칼바람")){
        
                        const queueId = convertUtil.getQueueId(param1)
                        // 잘못된 게임 종류 입력시
                        if(typeof queueId === "undefined"){

                            console.log("전적, 큐타입 입력 => " + autoMessage["bad-input"])

                            content = new kakaoEmbed
                            content.addText(autoMessage["bad-input"])
                            res.status(200).send(content.output())
                            return
                            
                        }

                        requestUrl = `${keys.riotUrl}/match/v4/matchlists/by-account/${accountId}?queue=${queueId}&endIndex=20&beginIndex=0&api_key=${keys.riotAPI}`
        
                    }else{

                        const championId = convertUtil.getChampionId(param1)
                        // 잘못된 챔피언 이름 입력시
                        if(typeof championId === "undefined"){

                            console.log("전적, 챔피언명 입력 => " + autoMessage["bad-input"])

                            content = new kakaoEmbed
                            content.addText(autoMessage["bad-input"])
                            res.status(200).send(content.output())
                            return
                            
                        }

                        requestUrl = `${keys.riotUrl}/match/v4/matchlists/by-account/${accountId}?champion=${championId}&endIndex=20&beginIndex=0&api_key=${keys.riotAPI}`
                    }
        
                }else if(objectArr.length === 3){

                    // 게임 종류 입력시
                    const championId = convertUtil.getChampionId(param1)

                    // 잘못된 챔피언 이름 입력시
                    if(typeof championId === "undefined"){

                        console.log("전적, 챔피언명 입력 => " + autoMessage["bad-input"])

                        content = new kakaoEmbed
                        content.addText(autoMessage["bad-input"])
                        res.status(200).send(content.output())
                        return

                    }
                    
                    const queueId = convertUtil.getQueueId(param2)

                    // 잘못된 게임 종류 입력시
                    if(typeof queueId === "undefined"){
                        
                        console.log("전적, 큐타입 입력 => " + autoMessage["bad-input"])

                        content = new kakaoEmbed
                        content.addText(autoMessage["bad-input"])
                        res.status(200).send(content.output())
                        return
                    }

                    requestUrl = `${keys.riotUrl}/match/v4/matchlists/by-account/${accountId}?champion=${championId}&queue=${queueId}&endIndex=20&beginIndex=0&api_key=${keys.riotAPI}`

                }else{

                    console.log("전적. 공백 에러 => " + autoMessage["bad-input"])

                    content = new kakaoEmbed
                    content.addText(autoMessage["bad-input"])
                    res.status(200).send(content.output())
                    return

                }
        
                const refObj = {cnt:0,win:0,losses:0,kill:0,death:0,assist:0,damageInTeam:0,damageInAll:0}
                let objArr = [
                                {queueType:420,champions:[], ...refObj},
                                {queueType:430,champions:[], ...refObj},
                                {queueType:440,champions:[], ...refObj},
                                {queueType:450,champions:[], ...refObj}
                            ]
                
                // 전적 검색 시작
                const getMatchData = new Promise((resolve, reject) => {
                    request(requestUrl, (error, response, body) => {
                        if(error) throw error
                        if(response.statusCode === 200){
                            // const matches_obj = JSON.parse(body).matches
                            resolve(JSON.parse(body).matches)
                        }else{
                            console.log("전적.검색실패 => " + autoMessage["non-info"])

                            content = new kakaoEmbed
                            content.addText(autoMessage["non-info"])
                            res.status(200).send(content.output())
                            return
                        }
                    })
                })
        
                getMatchData.then(matchData => {
        
                    setTimeout(() => {
        
                        const matches_obj = matchData
        
                        // 검색한 게임 수
                        let count = matches_obj.length
                        console.log(`게임 수 : ${count}`)
        
                        let gameId
        
                        matches_obj.forEach(item => {
        
                            gameId = item.gameId
        
                            requestUrl = `${keys.riotUrl}/match/v4/matches/${gameId}?api_key=${keys.riotAPI}`
        
                            request(requestUrl, (error, response, body) => {
        
                                if(error) throw error
        
                                if(response.statusCode === 200){
        
                                    const matchDetail = JSON.parse(body)
        
                                    count--
        
                                    // 솔랭, 일반, 자랭, 칼바람 일때만 집계
                                    if(matchDetail.queueId === 420 || matchDetail.queueId === 430 || matchDetail.queueId === 440 || matchDetail.queueId === 450){
        
                                        matchDetail.participantIdentities.forEach(item => {
        
                                            if(item.player.summonerId === id){
        
                                                const participantId = item.participantId
        
                                                const selectedQueueId = (obj) => obj.queueType === matchDetail.queueId
                                                let objIdx
        
                                                matchDetail.participants.forEach(item => {
        
                                                    if(item.participantId === participantId){
        
                                                        objIdx = objArr.findIndex(selectedQueueId)
        
                                                        if(objIdx > -1){
        
                                                            const stats = item.stats
        
                                                            objArr[objIdx].cnt++
                                                            objArr[objIdx].champions.push(item.championId)
                                                            if(stats.win){
                                                                objArr[objIdx].win++
                                                            }else{
                                                                objArr[objIdx].losses++
                                                            }
                                                            
                                                            objArr[objIdx].kill+=stats.kills
                                                            objArr[objIdx].death+=stats.deaths
                                                            objArr[objIdx].assist+=stats.assists
                                                            objArr[objIdx].damageInTeam+=convertUtil.getDealtRank(matchDetail,participantId,false)
                                                            objArr[objIdx].damageInAll+=convertUtil.getDealtRank(matchDetail,participantId,true)
        
                                                        }
        
                                                    }
        
                                                })
        
                                            }
        
                                        })
        
                                    }
                                    
                                    // 모든 게임 검색 후 종합한 데이터 가공
                                    if(count === 0){

                                        //console.log(objArr)
                                        tmpMsg = ""
        
                                        objArr.forEach(item => {
                                            if(item.cnt > 0){
                                                
                                                tmpMsg += `${convertUtil.getQueueType(item.queueType)}\n`
                                                tmpMsg += `${item.win}승 ${item.losses}패 (${Math.floor(100*item.win/(item.win+item.losses))}%)\n`
        
                                                // 사용한 챔피언
                                                const res = item.champions.reduce((acc, championId) => {
                                                    acc[convertUtil.getChampionName(championId)] = (acc[convertUtil.getChampionName(championId)] || 0) + 1
                                                    return acc
                                                },{})
                                                let championLog = ""
                                                Object.entries(res).forEach(([name, cnt], index) => {
                                                    if(index === Object.keys(res).length-1){
                                                        championLog += `${name} ${cnt}`
                                                    }else{
                                                        championLog += `${name} ${cnt}, `
                                                    }
                                                })
                                                tmpMsg += `사용한 챔피언 : ${championLog}\n`
        
                                                tmpMsg += `K/D/A : ${item.kill}/${item.death}/${item.assist} (${((item.kill+item.assist)/(item.death === 0 ? 1/1.2 : item.death)).toFixed(2)})\n`
                                                tmpMsg += `평균 딜량 순위 : 팀내 ${(item.damageInTeam/item.cnt).toFixed(1)}등 / 전체 ${(item.damageInAll/item.cnt).toFixed(1)}등`

                                                carouselItemObj = {}
                                                carouselItemObj.title = `${convertUtil.getQueueType(item.queueType)} (${item.win+item.losses})`
                                                carouselItemObj.description = "아래 버튼을 눌러 상세 결과를 조회해주세요"
                                                carouselItemObj.buttons = [{action: "block", blockId: "'5fc6f55e42380f6fd47b4426', ", messageText: tmpMsg}]

                                                carouselObj.items.push(carouselItemObj)
        
                                            }
                                        })

                                        content = new kakaoEmbed
                                        content.addCarousel(carouselObj)
                                        res.status(200).send(content.output())
                                        return
                                    }
        
                                }else if(response.statusCode){

                                    console.log("전적.검색 => " + autoMessage["limit-exceeded"])

                                    content = new kakaoEmbed
                                    content.addText(autoMessage["limit-exceeded"])
                                    res.status(200).send(content.output())
                                    return

                                }else{

                                    console.log("전적.검색 => " + autoMessage["non-info"])
                                    
                                    content = new kakaoEmbed
                                    content.addText(autoMessage["non-info"])
                                    res.status(200).send(content.output())
                                    return
                                }
        
                            })
        
                        })
        
                        if(matches_obj.length === 0){
                            
                            console.log("전적.검색.결과 => " + autoMessage["non-info"])
                                    
                            content = new kakaoEmbed
                            content.addText(autoMessage["non-info"])
                            res.status(200).send(content.output())
                            return

                        }
        
                    },1500)

                })

            }

        })

    }

})



app.listen(59049,function(){
  console.log('Connect 59049 port!')
})