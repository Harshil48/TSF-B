var mongoose=require("mongoose");

var custSchema=new mongoose.Schema({
    firstname: String,
    lastname: String,
	gender: String,
	age: Number,
	accountNo: String,
	currentBal: Number,
    email: String,
	contactNo: String,
	profileimage: String,
});

module.exports=mongoose.model("Customer",custSchema);