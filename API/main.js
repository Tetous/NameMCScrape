const { MongoClient } = require('mongodb');
const fastify = require('fastify')({ logger: true })
require('dotenv').config({path: "../.env"})

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

client.connect(err => {
  const collection = client.db("NameMC").collection("NameMC");
  console.log(err)

  fastify.get('/', async (request, reply) => {
    return { hotel: 'trivago' }
  })

  fastify.get('/droptime', async (request, reply) => {
    const name = request.query.name;
    await collection.find({name: name}).toArray(function(err, docs) {
      console.log("Name: " + name)
      console.log("Error: " + err)
      console.log("docs:" + JSON.stringify(docs))
      if (err != null) {
        reply.send({error: err, message: getMessage()})
      } else if (!docs.length) {
        reply.send({error: "Name not dropping or name not cached", message: getMessage()})
      } else {
        reply.send({
          name: docs[0].name,
          UNIX: docs[0].UNIX,
          droptime: docs[0].droptime,
          searches: docs[0].searches,
          updated: docs[0].updated,
          message: getMessage()
        })
      }
    });
  
  })

  const start = async () => {
    try {
      await fastify.listen(3000)
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  }
  start()

  // perform actions on the collection object
});