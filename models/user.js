const mongoose = require("mongoose")

const user = new mongoose.Schema({
    email: {
        type : String,
        required : true,
        unique : true
    },
    name: {
        type : String,
        required : true
    },
    password: {
        type : String,
        required : true
    },
    vehicle: {
        type : String,
        required : true
    },
    plate: {
        type : String,
        required : true
    },
    date : {
        type : Date,
        default : Date.now
    }
})

module.exports = mongoose.model("user",user)