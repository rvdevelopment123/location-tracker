const mongoose = require("mongoose")

const vehicleTracker = new mongoose.Schema({
    driverId: {
        type : String,
        required : true
    },
    lat: {
        type : String,
        required : true
    },
    lng: {
        type : String,
        required : true
    },
    date : {
        type : Date,
        default : Date.now
    }
})

module.exports = mongoose.model("vehicleTracker",vehicleTracker)