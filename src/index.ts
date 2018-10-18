"use strict"
import * as Express from "express"
import * as Request from "request-promise-native"

const wel = Express()

wel.get("/cgi-bin/WEL_post.cgi", (request, response) => {
  // Write data to database
  const welData = request.query
  sendToWel(welData)
  response.end("200")
})

async function sendToWel(queryString: Object): Promise<any>{
  const welUrl = "http://www.welserver.com/cgi-bin/WEL_post.cgi"
  const options = {
    uri: welUrl,
    qs: queryString,
  }
  try {
    const result = await Request.get(options)
    console.log(`${Date().toLocaleString()} - Result from WEL: ${result}`)
    return result
  } catch(e) {
    console.log(`${Date().toLocaleString()} - Error sending to WEL: ${e}`)
  } 
}

wel.listen(8080)