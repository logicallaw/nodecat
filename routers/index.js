const express=require('express')
const axios=require('axios')

const router=express.Router()
const URL='http://localhost:8002/v2'
axios.defaults.headers.origin = 'http://localhost:4000' //origin 헤더 추가
const request = async (req,api) => {
    try {
        if (!req.session.jwt) { // 세션에 토큰 없으면
            const tokenResult = await axios.post(`${URL}/token`,{
                clientSecret:process.env.CLIENT_SECRET
            })
            req.session.jwt=tokenResult.data.token //세션에 토큰 저장

        }
        // 토큰이 존재하면 서버에서 원하는 API 불러와서 출력하기
        return await axios.get(`${URL}${api}`,{
            headers:{authorization:req.session.jwt}
        }) //api 요청
    } catch (error) {
        if (error){
            delete req.status.jwt
            return request(req,api)
        } 
        console.error(error)
        next(error)

    }
}

router.get('/mypost',async(req,res,next)=>{
    try {
        // 토큰의 존재여부 및 원하는 API 정보 읽어들이기
        const result=await request(req,'/posts/my')
        res.json(result.data)
    } catch (error) {
        console.error(error)
        next(error)
    }
})

router.get('/search/:hashtag', async (req,res,next)=>{
    try {
        // 토큰의 존재여부 및 원하는 API 정보 읽어들이기
        const result = await request(
            req,`/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
        )
        res.json(result.data)
    } catch (error) {
        if (error.code) {
            console.error(error)
            next(error)
        }
    }
})

//토큰 테스트 라우터

router.get('/test',async(req,res,next)=>{ //토큰 테스트 라우터
    try {
        if (!req.session.jwt) { //세션에 토큰이 없으면 토큰 발급 시도
            const tokenResult=await axios.post('http://localhost:8002/v1/token',{
                clientSecret:process.env.CLIENT_SECRET
            }) 
            if (tokenResult.data && tokenResult.data.code === 200){ //토큰 발급 성공
                req.session.jwt=tokenResult.data.token //세션에 토큰 저장
            } else { //토큰 발급 실패
                return res.json(tokenResult.data) //발급 실패 사유 응답
            }
        }
        // 발급 받은 토큰 테스트
        const result=await axios.get('http://localhost:8002/v1/test',{
            headers:{authorization:req.session.jwt}
        })
        return res.json(result.data)
    } catch (error) {
        console.error(error)
        if (error.response.status === 419){
            return res.json(error.response.data)
        } 
        return next(error)
    }
})



module.exports=router