const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
    email:{
        type:String,
        unique:true,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    status:{
        type:Number,
        required:true
    },
});
module.exports=mongoose.model("User",userSchema);