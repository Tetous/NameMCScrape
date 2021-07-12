const { MongoClient } = require('mongodb');
const fastify = require('fastify')({ logger: false })
require('dotenv').config({path: "../.env"})
const path = require('path')

fastify.register(require('fastify-static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/', // optional: default '/'
})

const uri = `mongodb+srv://${process.env.ATLAS_USER}:${process.env.ATLAS_PWD}@${process.env.ATLAS_URL}/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

function getMessage() {
  choices = [
    "Buy HuntahVPN today - HuntahVPN.org",
    "Proudly presented by PiratSniper - api.peet.ws",
    "'Best droptime API' -Coolkidmacho (owner of API with 10% downtime)",
    "'piss' -cris",
    "'Hi gamer' -olli",
    "'PiratSnipe on top!' -everyone",
    "#TensForAdmin",
    "'Cum, haha funny' -frez",
    "RIP huntah bot 2021-2021 🪦 (kqzz pls add it again I am begging you pls)",
    "KQZZ ADD HUNTAH BOT NOW"
  ]
  let index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

async function get3chars(collection) {
  await collection.find({ 
    "name": /^[\s\S]{,4}$/, // name.length <= 3
  }).toArray(function(err, docs) {
    console.log("Error: " + err)
    console.log("docs:" + JSON.stringify(docs))
    if (err != null) {
      return {error: err, message: getMessage()}
    } else if (!docs.length) {
      return {error: "No 3chars dropping", message: getMessage()}
    } else {
      // this can probably be solved easier using .map()
      ret = []
      docs.forEach(element => {
        if (element.UNIX > Math.floor(+new Date() / 1000)) {
          ret.push({
            name: docs[0].name,
            UNIX: docs[0].UNIX,
            // droptime: docs[0].droptime,
            searches: docs[0].searches,
            updated: docs[0].updated,
            message: getMessage()
          })
        }
      });
      return ret
    }
  })
}

client.connect(err => {
  const collection = client.db("NameMC").collection("NameMC");
  console.log(err)
  collection.countDocuments({}, (error, numOfDocs) => {
    console.log(error)
    console.log(numOfDocs, "documents cached")
  })

  fastify.get('/', async (request, reply) => {
    reply.sendFile('info.html')
  })

  fastify.get('/info', async (request, reply) => {
    collection.countDocuments({}, (error, numOfDocs) => {
      if (!error) {
        reply.send({cached: numOfDocs, message: getMessage(), github: "https://github.com/wwhtrbbtt/NameMCScrape"})
      } else {
        reply.send({error: error, message: getMessage(), github: "https://github.com/wwhtrbbtt/NameMCScrape"})
      }
    })
  })

  fastify.get('/3chars', async (request, reply) => {
    const regex =  new RegExp(`^.{,5}$`,'g');

    await collection.find({ 
      "name": { '$regex': regex }, // name.length <= 3
    }).toArray(function(err, docs) {
      console.log("Error: " + err)
      console.log("docs:" + JSON.stringify(docs))
      if (err != null) {
        reply.send({error: err, message: getMessage()})
      } else if (!docs.length) {
        reply.send({error: "No 3chars dropping", message: getMessage()})
      } else {
        // this can probably be solved easier using .map()
        ret = []
        docs.forEach(element => {
          if (element.UNIX > Math.floor(+new Date() / 1000)) {
            ret.push({
              name: docs[0].name,
              UNIX: docs[0].UNIX,
              // droptime: docs[0].droptime,
              searches: docs[0].searches,
              updated: docs[0].updated,
              message: getMessage()
            })
          }
        });
        reply.send(ret)
      }
    })
  })

  fastify.get('/droptime', async (request, reply) => {
    const name = request.query.name;
    
    const regex =  new RegExp(`^${name}$`,'i');

    await collection.find({name: { '$regex': regex }}).toArray(function(err, docs) {
      console.log("Name: " + name)
      console.log("Error: " + err)
      console.log("docs:" + JSON.stringify(docs))
      if (err != null) {
        reply.send({error: err, message: getMessage()})
      } else if (!docs.length) {
        reply.send({error: "Name not dropping or name not cached", message: getMessage()})
      } else if (docs[0].UNIX < Math.floor(+new Date() / 1000)) {
        // already dropped
        collection.deleteOne({name: name}) // delete
        reply.send({error: "Name already dropped, deleted from DB", dropAgo: Math.floor(+new Date() / 1000) - docs[0].UNIX, message: getMessage()})
      } else {
        reply.send({
          name: docs[0].name,
          UNIX: docs[0].UNIX,
          // droptime: docs[0].droptime,
          searches: parseInt(docs[0].searches),
          updated: docs[0].updated,
          message: getMessage()
        })
      }
    });
  })

  const start = async () => {
    try {
      await fastify.listen(80, "0.0.0.0")
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  }
  start()

  // perform actions on the collection object
});