import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { WritableStream, TransformStream } from 'node:stream/web'

import { setTimeout } from 'node:timers/promises'

import csvToJson from 'csvtojson'

const PORT = 3000

createServer(async (request, response) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
    }

    if(request.method === 'OPTIONS') {
        response.writeHead(204, headers)
        response.end()

        return;
    }

    let items = 0

    request.once('close', () => {
        console.log(`connect was closed! items amount ${items}`)
    })

    Readable.toWeb(
        createReadStream('train.csv')
    )
    .pipeThrough(
        Transform.toWeb(csvToJson())
    )
    .pipeThrough(
        new TransformStream({
            transform(chunk, controller) {
                const data =(JSON.parse(Buffer.from(chunk).toString()))
                const mappedData = {
                    id: data.ID,
                    mig_year: data.mig_year,
                    education: data.education
                }
                controller.enqueue(JSON.stringify(mappedData).concat('\n'))
            }
        })
    )
    .pipeTo(new WritableStream({
        async write(chunk) {
            items++
            response.write(chunk)
        },
        close() {
            response.end()
        }
    }))


    response.writeHead(200, headers)
})
.listen(PORT)
.on('listening', () => console.log('server is running'))