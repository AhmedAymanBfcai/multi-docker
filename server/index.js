const keys = require('./keys')

// Express App Setup
const express = require('express')
const bodyParser = require('body-parser') // To parse the Incoming reuests and turned the body of the post request into a json value that our express API can then work with.

const cors = require('cors') // Cors package allos us to make requests from one domain that the react application is running on to a completely different domain or a different port.

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Postgres Client Setup
const { Pool } = require('pg')
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
})
pgClient.on('error', () => console.log('Lost PG connection'))

pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch((err) => console.log(err))

// Redis Client Setup
const redis = require('redis')
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
})
const redisPublisher = redisClient.duplicate() // According to the docs if we have a client that's listening or publishing infromation on radis we have to make a duplicate connection because when a connection is turned into a connection that's going to listen or subscribe or publish information it cannot be used for other purposes.

// Express route handlers
app.get('/', (req, res) => {
  res.send('Hi')
})

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values')

  res.send(values.rows) // The row back is here to make sure that we only send back the actual information that we were take from the database and no other information that is contained inside this value's object.
})

// Redis doesnot support promise so we need to use a callback as opposed to making use of async await.
app.get('/values/current', async (req, res) => {
  //To get the all infromation from the hash value inside redis.
  redisClient.hgetall('values', (err, values) => {
    res.send(values)
  })
})

app.post('/values', async (req, res) => {
  const index = req.body.index

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high')
  }

  redisClient.hset('values', index, 'Nothing yet!')
  redisPublisher.publish('insert', index)
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index])

  res.send({ working: true })
})

app.listen(5000, (err) => {
  console.log('Listening')
})
