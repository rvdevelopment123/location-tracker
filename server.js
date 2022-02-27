const express = require("express")
const cors = require("cors")
const path = require("path")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const app = express()
const server = require("http").createServer(app)
const io = require("socket.io")(server,{cors : {origin : "*"}})
const mongoose = require("mongoose")

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(express.static(__dirname + '/public'))

// -----------------------------------------------
// Middleware
// -----------------------------------------------
const authToken = require("./middleware/auth.middleware")

// -----------------------------------------------
// Models
// -----------------------------------------------
const vehicleTracker = require("./models/vehicle-tracker")

// -----------------------------------------------
// MongoDB Connection
// -----------------------------------------------

mongoose.connect("mongodb://localhost/chatdb",{ 
    useNewUrlParser:true,
    useUnifiedTopology:true
})
const con = mongoose.connection

// -----------------------------------------------
// API
// -----------------------------------------------

app.use('/user', require("./routes/user.routes.js"))

app.get('/test',authToken,(req, res)=>{
    res.send({status : true, message : "Authorized!"})
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'./public/index.html'))
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname,'./public/register.html'))
})

app.get('/driver', (req, res) => {
    res.sendFile(path.join(__dirname,'./public/driver.html'))
})

app.get('/client', (req, res) => {
    res.sendFile(path.join(__dirname,'./public/client.html'))
})

server.listen(3001, () => console.log(`server runs at 3001`))

// -----------------------------------------------
// Live Tracking
// -----------------------------------------------

class LiveTracking {
    constructor()
    {
        this.RoomLocation = {}
        this.JoinedRooms = {
            shed : [],
            location : []
        }
    }
    // Join shed
    async joinShed (socket, data)
    {
        // Client and Driver join shed
        socket.join(data.room)
        console.log('Someone Join in the ' + data.room)
        // Push to the list of rooms you joined
        //Join User in the Shed
        this.JoinedRooms.shed.push(data.room)
        //TODO: Get the list of nearest Driver from the Shed_1(dynamic)
        var vehicles = [{
            name: "JEEP 1",
            plateno: "XXX-123",
            position: {
              lat: 14.357201,
              lng: 120.923170
            },
            ginfo: {
              "rows": [{
                "elements": [{
                  "distance": {
                    "text": "0.7 km",
                    "value": 735
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 144
                  },
                  "status": "OK"
                }]
              }],
              "originAddresses": ["184 Malagasang II-C, Malagasang II, Imus, Cavite, Philippines"],
              "destinationAddresses": ["310 Don Placido Campos Avenue, Dasmariñas, 4114 Cavite, Philippines"]
            },

          },
          {
            name: "JEEP 2",
            plateno: "YYY-456",
            position: {
              lat: 14.357852,
              lng: 120.925856
            },
            ginfo: {
              "rows": [{
                "elements": [{
                  "distance": {
                    "text": "0.7 km",
                    "value": 735
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 144
                  },
                  "status": "OK"
                }]
              }],
              "originAddresses": ["184 Malagasang II-C, Malagasang II, Imus, Cavite, Philippines"],
              "destinationAddresses": ["310 Don Placido Campos Avenue, Dasmariñas, 4114 Cavite, Philippines"]
            }
          },
          {
            name: "JEEP 3",
            plateno: "AAA-123",
            position: {
              lat: 14.372844779921824,
              lng: 120.92862093547713
            },
            ginfo: {
              "rows": [{
                "elements": [{
                  "distance": {
                    "text": "0.7 km",
                    "value": 735
                  },
                  "duration": {
                    "text": "2 mins",
                    "value": 144
                  },
                  "status": "OK"
                }]
              }],
              "originAddresses": ["184 Malagasang II-C, Malagasang II, Imus, Cavite, Philippines"],
              "destinationAddresses": ["310 Don Placido Campos Avenue, Dasmariñas, 4114 Cavite, Philippines"]
            }
          }
        ]
        socket.broadcast.emit("Shed_1", data)
        // socket.broadcast.emit("channel:locations", vehicles)
        // socket.broadcast.emit("channel:locations", vehicles)
       return data
        console.log('Join Shed Done')
    }
    // Join location
    async joinLocation (socket, data) 
    {
        // JOIN DRIVER IN LOCATION ROOM
        socket.join(data.location)

        if(!this.RoomLocation[data.location])
        {
            this.RoomLocation[data.location] = {
                count : 1,
                location : data.location
            }
        }
        else{
            this.RoomLocation[data.location].count++
        }

        // Push to the list of rooms you joined
        this.JoinedRooms.location.push(data.location)
        console.log(this.RoomLocation)
        // broadcast to channel
        const res = this.RoomLocation
        socket.broadcast.emit("channel:locations",res)
    }

    // For Drivers
    async driverSendLocation (socket, data)
    {
        
        // socket.broadcast.emit("Shed_1", data)
        data.ginfo = {
            "rows": [{
              "elements": [{
                "distance": {
                  "text": "0.7 km",
                  "value": 735
                },
                "duration": {
                  "text": "2 mins",
                  "value": 144
                },
                "status": "OK"
              }]
            }],
            "originAddresses": ["184 Malagasang II-C, Malagasang II, Imus, Cavite, Philippines"],
            "destinationAddresses": ["310 Don Placido Campos Avenue, Dasmariñas, 4114 Cavite, Philippines"]
          }
        socket.broadcast.emit("channel:locations",data)
        // Save data to MongoDB
        try{
            // const coordinates = new vehicleTracker({
            //     driverId : data.driver,
            //     lat : data.position.lat,
            //     lng : data.position.lng
            // })

            const res = await vehicleTracker.updateOne(
                { driverId: data.driver },
                { $set: { lat: data.position.lat, lng : data.position.lng } },
                { upsert: true } // Make this update into an upsert
              );
              
              // Will be 1 if MongoDB modified an existing document, or 0
              // if MongoDB inserted a new document.
              res.nModified;
              // Contains an array of descriptions of the documents inserted,
              // including the `_id` of all inserted docs.
              res.upserted;

              console.info(data)
            console.info(res)
            // const save = await coordinates.update()
            // Broadcast data of driver in the room
           
        }
        catch(err){
            console.log(err)
        }
    }

    leave (socket,data)
    {
        this.JoinedRooms.location.forEach(each => {
            this.RoomLocation[each].count--
        })
        
        // Rebroadcast to channel
        const res = this.RoomLocation
        console.log(res)
        socket.emit("channel:locations",res)
    }

    _init ()
    {
        io.on('connection', (socket) => {
            console.log(`New user : ${socket.id}`)

            const res = this.RoomLocation
            console.log('Res')
            console.info(res)
            socket.broadcast.emit("channel:locations",res)

            // LOCATION JOIN
            socket.on("join:location", (data) => this.joinLocation(socket,data))

            // SHED JOIN
            socket.on("join:shed", (data) => this.joinShed(socket,data))

            // FOR DRIVERS
            socket.on("drivers", (data) => this.driverSendLocation(socket,data))

            // DISCONNECT
            socket.on('disconnect', (data) => this.leave(socket,data))
        })
    }
}

(new LiveTracking)._init()
