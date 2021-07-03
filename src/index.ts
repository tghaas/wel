import * as Express from "express"
import * as Influx from "influx"
import * as Winston from "winston"
import Axios from "axios"
import { debug } from "console"
import { InfluxWelPoint } from "./types"


"use strict"

const wel = Express()
const logLevel = process.env.DEBUG === "true" ? "debug" : "info"
const logger = Winston.createLogger({
  format: Winston.format.combine(
    Winston.format.timestamp(),
    Winston.format.json()
  ),
  level: logLevel,
  transports: [ new Winston.transports.Console({ level: logLevel }) ]
})

const influx = new Influx.InfluxDB({
  host: "wellogger.h.local",
  port: 8086,
  protocol: "http",
  database: "wel"
})

wel.get("/cgi-bin/WEL_post.cgi", (req, res) => {
  const welData = req.query
  sendToWel(welData)
  writeToInflux(welData)
  res.end("200")
})

async function sendToWel(queryString: object): Promise<any> {
  const welUrl = "http://www.welserver.com/cgi-bin/WEL_post.cgi"
  try {
    const result = await Axios.get(welUrl, { params: queryString })
    logger.info(`Result from WEL: ${JSON.stringify(result.data)}`)
    return result
  } catch (e) {
    logger.error(`Error sending to WEL: ${e}`)
  }
}

async function writeToInflux(queryString: any): Promise<void> {
  logger.debug("Raw Wel Data: " + JSON.stringify(queryString))
  const parsedWelData: any = parseWelData(queryString)
  logger.debug("Parsed Wel Data: " + JSON.stringify(parsedWelData))
  const currentWelData: InfluxWelPoint = [ {
    measurement: "wel",
    tags: {
      wel: queryString.Uu
    },
    fields: {
      airReturn: parsedWelData.air_return,
      airSupply: parsedWelData.supply_air,
      basementTemp: parsedWelData.Basement_Temp,
      bedRoomTemp: parsedWelData.zone2_temp,
      hotWaterGeneratorIn: parsedWelData.HWG_In,
      hotWaterGeneratorOut: parsedWelData.HWG_Out,
      livingRoomTemp: parsedWelData.zone1_temp,
      outsideTemp: parsedWelData.outside_temp,
      wattNodeGSHP: parsedWelData.watt_node_GSHP,
      wattNodeOther: parsedWelData.kwh_remain,
      wattNodeTotal: parsedWelData.watt_node_Total
    }
  } ]
  try {
    return await influx.writePoints(currentWelData)
  } catch (e) {
    logger.error(`Error writing to InfluxDB: ${e}`)
  }
}

function parseWelData(welData: any): any {
  for (const d in welData) {
    welData[ d ] = parseFloat(welData[ d ])
  }
  return welData
}

wel.listen(8080)
