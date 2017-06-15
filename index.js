#!/usr/bin/env node

const async = require('async')
const colors = require('colors')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const request = require('request')

const BUILD_DIR = './build'
const CONTENT_DIR = 'content'
const CWD = process.cwd()
const HOST = process.env.HOST
const MASHUP = !!process.env.MASHUP
const PKG = require(path.resolve(CWD, './package.json'))
const XRF_KEY = require('randomstring').generate({
  length: 16,
  charset: 'alphanumeric'
})
const ZIP_FILE = `${PKG.name}.zip`

let requests = []

const headers = {
  'X-Qlik-Xrfkey': XRF_KEY,
  userid: process.env.USERID
}
const qs = {
  xrfkey: XRF_KEY
}

const extension = request.defaults({
  baseUrl: `${HOST}extension/`,
  headers,
  qs
})

requests.push((done) => {
  extension.delete(`name/${PKG.name}`, (error) => {
    console.log(`Successfully deleted old extension ${PKG.name}`)
    done(error)
  })
})

requests.push((done) => {
  const stream = fs.createReadStream(path.join(CWD, BUILD_DIR, ZIP_FILE))

  stream.on('error', done)
  stream.pipe(
    extension
      .post('upload', {
        headers: Object.assign(headers, {
          'content-type': 'application/x-www-form-urlencoded'
        })
      })
      .on('error', (error) => done(error.toString()))
      .on('data', (data) => console.log(PKG.name, data.toString()))
      .on('response', (response) => {
        console.log(`Successfully deployed extension ${PKG.name}`, response.statusCode)
        done()
      })
  )
})

if (MASHUP) {
  if (!PKG.deploy || !PKG.deploy.id || !PKG.deploy.cdn) {
    throw new Error('Missing deploy: { id, cdn } config in package.json')
  }

  const content = request.defaults({
    baseUrl: `${HOST}contentlibrary/${PKG.deploy.id}/uploadfile`,
    headers
  })

  const files = glob.sync(path.join(CWD, BUILD_DIR, CONTENT_DIR, PKG.deploy.id, PKG.deploy.cdn, '*'))

  requests = requests.concat(
    files
      .map((file) => (done) => {
        const externalpath = path.join(PKG.deploy.cdn, path.basename(file))
        const stream = fs.createReadStream(file)

        stream.on('error', done)
        stream.pipe(
          content
            .post('', {
              qs: Object.assign(qs, {
                overwrite: true,
                externalpath
              })
            })
            .on('error', (error) => done(error.toString()))
            .on('data', (data) => console.log(`Successfully deployed shared content ${externalpath} to ${data.toString()}`))
            .on('response', (response) => done())
        )
      })
  )
}

async.series(requests, (error) => {
  if (error) {
    console.log(colors.red(error))
  } else {
    console.log(colors.bold.green('All files successfully deployed'))
  }
})
