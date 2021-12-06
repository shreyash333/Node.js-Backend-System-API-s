var express =require('express')
var router=require('./router')
require('dotenv')
var app=express()


app.use(router)
app.listen(process.env.PORT||12345, () => {
    console.log(`Example app listening at http:localhost:${process.env.PORT||12345}`)
  })


