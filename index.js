const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config();


//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sr446qq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
  try{
    await client.connect();
    const servicesCollection = client.db('doctor_portal').collection('services');
    const bookingCollection = client.db('doctor_portal').collection('booking');
    const userCollection = client.db('doctor_portal').collection('users');

    app.get('/services', async(req,res)=>{
      const query ={};
      const cursor = servicesCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    })

    app.put('/user/:email', async(req,res)=>{
      const email = req.params.email;
      const filter= {email:email};
      const options = {upsert: true}
      const updateDoc = {
        $set: userCollection,
      };
    })


    //available
    // Warning:
    // this is not the proper way to query
    // after learning more about mongodb use aggregate lookup, pipeline, match, group
    app.get('/available', async(req,res)=>{
      const date = req.query.date;

      // step-1 get all services
      const services = await servicesCollection.find().toArray();

      //get the booking of that day
      const query = {date: date};
      const bookings = await bookingCollection.find(query).toArray();

      //step 3: for each service, 
      services.forEach(service=>{
        // step-4: find bookings for that service. output: [{},{},{}]
        const serviceBookings = bookings.filter(b=>b.treatment === service.name);

        // step -5: select slots for the service bookings: ['','','']
        const booked = serviceBookings.map(book=>book.slot);

        //select those slots that not booked slot
        const available = service.slots.filter(s=> !booked.includes(s));
        
        // step-7: set available to slots to make it easier
        service.slots = available;

      })

      res.send(services);


    })

    /**
     * API NAming Convention 
     * app.get('/booking') // get all bookings in this collection. or get more than one or by filter
     * app.get('/booking/:id') // get a specific booking
     * app.post('/booking') // add a new booking
     * app.patch('/booking/:id') // 
     * app.put('/booking/:id') // upsert ==> update (if exists) or insert (if doesn't exist)
     * app.delete('/booking/:id')
     */

    app.get('/booking', async(req,res)=>{
      const patient = req.query.patient;
      const query = {patient: patient}
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings)

    })

    //booking
    app.post('/booking', async(req,res)=>{
      const booking = req.body;
      const query = {treatment: booking.treatment, date: booking.date, patient: booking.patient}
      const exists = await bookingCollection.findOne(query);
      if(exists){
        return res.send({success: false, booking: exists})
      }

      const result = bookingCollection.insertOne(booking);
      return res.send({success: true,result});
    })
  }
  finally{
    
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from doctor Uncle!') 
})

app.listen(port, () => {
  console.log(`Doctors app port ${port}`)
})