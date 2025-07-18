import Express from "express"
import * as Influx from "influx"
import * as Winston from "winston"
import Axios from "axios"
import { InfluxWelPoint, temperatureSensor } from "./types"
import { OutgoingHttpHeaders } from "http"

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

const haHeaders: OutgoingHttpHeaders = {
  'Content-Type': 'text/json',
  'Authorization': `Bearer ${process.env.HA_TOKEN}`
}

async function sendHomeAssistant(sensor: string, sensorData: temperatureSensor): Promise<any> {
  const haUrl = `http://wellogger.h.local:8123/api/states/sensor.${sensor}`
  try {
    const result = await Axios.post(haUrl, sensorData, {headers: haHeaders})
    logger.debug(`Result from HA: ${JSON.stringify(result.data)}`)
    return result
  } catch (e) {
    logger.error(`Error sending to HA: ${e}`)
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
      airReturn: parsedWelData.air_return || 0,
      airSupply: parsedWelData.supply_air || 0,
      basementTemp: parsedWelData.basement_temp || 0,
      bedRoomTemp: parsedWelData.zone2_temp || 0,
      hotWaterGeneratorIn: parsedWelData.hwg_in || 0,
      hotWaterGeneratorOut: parsedWelData.hwg_out || 0,
      livingRoomTemp: parsedWelData.zone1_temp || 0,
      outsideTemp: parsedWelData.outside_temp || 0,
      wattNodeGSHP: parsedWelData.watt_node_gshp || 0,
      wattNodeOther: parsedWelData.kwh_remain || 0,
      wattNodeTotal: parsedWelData.watt_node_total || 0
    }
  } ]
  try {
    await sendHomeAssistant('outside_temp', {state: parsedWelData.outside_temp, attributes: {unit_of_measurement: "°F"}})
    await sendHomeAssistant('zone1_temp', {state: parsedWelData.zone1_temp, attributes: {unit_of_measurement: "°F"}})
    await sendHomeAssistant('zone2_temp', {state: parsedWelData.zone2_temp, attributes: {unit_of_measurement: "°F"}})
    await sendHomeAssistant('basement_temp', {state: parsedWelData.basement_temp, attributes: {unit_of_measurement: "°F"}})
    await sendHomeAssistant('hot_water_generator_in', {state: tempWhenOn(parsedWelData.fan_g,parsedWelData.hwg_in), attributes: {unit_of_measurement: "°F"}})
    await sendHomeAssistant('hot_water_generator_out', {state: tempWhenOn(parsedWelData.fan_g,parsedWelData.hwg_out), attributes: {unit_of_measurement: "°F"}})
    await sendHomeAssistant('hvac_supply_air', {state: tempWhenOn(parsedWelData.fan_g, parsedWelData.supply_air), attributes: {unit_of_measurement: "°F"}})
    await sendHomeAssistant('hvac_return_air', {state: tempWhenOn( parsedWelData.fan_g,parsedWelData.return_air), attributes: {unit_of_measurement: "°F"}})
    await sendHomeAssistant('entering_water_temp', {state: tempWhenOn(parsedWelData.fan_g, parsedWelData.ewt), attributes: {unit_of_measurement: "°F"}})
    await sendHomeAssistant('leaving_water_temp', {state: tempWhenOn(parsedWelData.fan_g, parsedWelData.lwt), attributes: {unit_of_measurement: "°F"}})
    await sendHomeAssistant('watt_node_heat_pump', {state: parsedWelData.watt_node_gshp, attributes: {unit_of_measurement: "W"}})
    await sendHomeAssistant('watt_node_total', {state: parsedWelData.watt_node_total, attributes: {unit_of_measurement: "W"}})
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

// Return certain temperatures only when the HVAC fan is running
// if fan is off, return zero
const tempWhenOn = (fanOnOff: number, temp: number): number => {
  return (fanOnOff === 1) ? temp : 0
}

wel.listen(8080)
