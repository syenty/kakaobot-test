const champions = require("../json-lol/champions.json")
const queue = require("../json-lol/queues.json")

const info = champions.data
const posiotionEnName = {탑:"TOP", 정글:"JUNGLE", 미드:"MID", 바텀:"ADC", 원딜:"ADC", 서포터:"SUPPORT", 서폿:"SUPPORT"}

class convertUtil {

    /**
     * @description 챔피언 아이디(number)로 챔피언 한글명을 반환
     * @param {number} id 챔피언 아이디
     */
    getChampionName = id => {
        for (const [enName, obj] of Object.entries(info)) {
            if(obj.key === ""+id){
                return obj.name
            }
        }
    }
    
    /**
     * @description 챔피언 한글명으로 챔피언 영문명 반환
     * @param {string} krName 챔피언 한글명
     */
    getChampionEnName = krName => {
        for (const [enName, obj] of Object.entries(info)) {
            if(obj.name === krName){
                return enName
            }
        }
    }
    
    /**
     * @description 챔피언 한글명으로 챔피언 아이디(number) 반환
     * @param {string} name 챔피언 한글명
     */
    getChampionId = name => {
        for (const [enName, obj] of Object.entries(info)) {
            if(obj.name === name){
                return obj.key
            }
        }
    }

    /**
     * @description 챔피언 한글명으로 챔피언 이미지 파일명 반환
     * @param {string} name 
     */
    getChampionImage = name => {
        for (const [enName, obj] of Object.entries(info)) {
            if(obj.name === name){
                return obj.image.full
            }
        }
    }
    
    /**
     * @description 큐 아이디(number)로 큐 한글명 반환
     * @param {number} queueId 큐 아이디
     */
    getQueueType = queueId => {
        for(const item of queue){
            if(queueId === item.queueId){
                return item.description
            }
        }
    }
    
    /**
     * @description 큐 한글명으로 큐 아이디(number) 반환
     * @param {string} queueName 
     */
    getQueueId = queueName => {
        for(const item of queue){
            if(queueName === item.description){
                return item.queueId
            }
        }
    }
    
    /**
     * @description 딜량 등수 반환 (flag : true 전체, false 팀 내)
     *              공동 딜량에 대한 처리 미구현
     * @param {object} matchDetail 
     * @param {number} participantId 
     * @param {boolean} flag 
     */
    getDealtRank = (matchDetail, participantId, flag) => {
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

    /**
     * @description 배열을 받아 가장 많이 선택된 챔피언 한글명 반환
     * @param {array} arr 
     */
    getMaxSelectedChampionName = arr => {
        if(arr.length < 1) return "empty"
        let max = -1
        let name = ""
        arr.forEach(item => {
            if(item[1]>max){
                max = item[1]
                name = item[0]
            }
        })
        return name
    }
    
    /**
     * @description 시간 변환
     * @param {number} ctime 
     */
    elapsedTimeFormatter = ctime => {
        const stime = parseInt(ctime/1000)
        return `${parseInt(stime/60)}:${stime%60 < 10 ? "0"+stime%60 : stime%60}`
    }
    
}

module.exports = convertUtil