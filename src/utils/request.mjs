import http from 'node:http'
import https from 'node:https'

export const request = async (url, headers = {}) => {
  let client

  if (url.startsWith('http:')) {
    client = http
  } else if (url.startsWith('https:')) {
    client = https
  }

  return new Promise((resolve, reject) => {
    let data = ''
    let status

    const req = client.get(url, { headers }, res => {
      res.on('data', chunk => {
        data += chunk
      })

      res.on('information', (info) => {
        status = info.statusCode
      })

      res.on('end', () => {
        resolve({
          text: data,
          status: res.statusCode,
          headers: res.headers,
        })
      })
    })

    req.on('error', err => {
      reject(err)
    })
  })
}
