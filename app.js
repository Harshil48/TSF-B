var express=require("express"),
	app=express(),
	bodyParser=require("body-parser"),
	mongoose=require("mongoose"),
	flash=require("connect-flash"),
	methodOverride=require("method-override"),
	Customers=require("./models/customers"),
	Transactions=require("./models/transactions");

var url= /* your MongoDB URL */

mongoose.connect(url,{
	useNewUrlParser:true,
	useCreateIndex:true,
	useUnifiedTopology:true,
	useFindAndModify:false
});

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment=require("moment");
app.use(require("express-session")({
	secret:"Secret",
	resave:false,
	saveUninitialized:false
}));
app.use(async function(req, res, next){
	res.locals.error=req.flash("error");
	res.locals.success=req.flash("success");
	next();
});

app.get("/",(req,res)=>{
	res.render("landingPage");
});

app.get("/home",(req,res)=>{
	res.render("homePage");
});

app.get("/contact",(req,res)=>{
	res.render("contact");
});

app.get("/customers",(req,res)=>{
	Customers.find({},(err,custs)=>{
		if(err){
			req.flash("error","Sorry, something went wrong !");
			return res.redirect("back");
		}
		res.render("customers",{custs:custs});
	});
});

app.get("/customers/:id",(req,res)=>{
	Customers.findById(req.params.id,(err,custs)=>{
		if(err){
			req.flash("error","Sorry, something went wrong !");
			return res.redirect("back");
		}
		Transactions.find().populate("from to").exec((err,transfers)=>{
			if(err){
				req.flash("error","Sorry, something went wrong !");
				return res.redirect("back");
			}
			res.render("singleCustomer",{custs:custs,transfers:transfers});
		});
	});
});

app.get("/customers/:id/transaction",(req,res)=>{
	Customers.findById(req.params.id,(err,from)=>{
		if(err){
			req.flash("error","Sorry, something went wrong !");
			return res.redirect("back");
		}
		Customers.find({accountNo:{$ne:from.accountNo}},(err,to)=>{
			if(err){
				req.flash("error","Sorry, something went wrong !");
				return res.redirect("back");
			}
			res.render("moneytransfer",{from:from, to:to});
		});
	});
});

app.post("/customers/:id/transaction",(req,res)=>{
	Customers.findById(req.params.id,(err,from)=>{
		if(err){
			req.flash("error","Sorry, something went wrong !");
			return res.redirect("back");
		}
		if(req.body.amount>from.currentBal){
			req.flash("error","Invalid Amount (Amount to be transferred must be less than your current balance) !");
			return res.redirect("back");
		}
		Transactions.create({from:req.params.id, to:req.body.to, amount:req.body.amount},(err,transaction)=>{
			if(err){
				req.flash("error","Sorry, something went wrong !");
				return res.redirect("back");
			}
			var newBal=from.currentBal-Number(req.body.amount);
			Customers.findByIdAndUpdate(from._id,{currentBal:newBal},(err,updtCust)=>{
				if(err){
					req.flash("error","Sorry, something went wrong !");
					return res.redirect("back");
				}
			});
			Customers.findById(req.body.to,(err,to)=>{
				if(err){
					req.flash("error","Sorry, something went wrong !");
					return res.redirect("back");
				}
				var newbal=to.currentBal+Number(req.body.amount);
				Customers.findByIdAndUpdate(to._id,{currentBal:newbal},(err,updtCust)=>{
					if(err){
						req.flash("error","Sorry, something went wrong !");
						return res.redirect("back");
					}
				});
			});
			req.flash("success","Transaction Successful !!!");
			res.redirect("/customers/"+req.params.id);
		});
	});
});

app.get("/transactionHistory",(req,res)=>{
	Transactions.find().populate("from to").exec((err,transaction)=>{
		if(err){
			req.flash("error","Sorry, something went wrong !");
			return res.redirect("back");
		}
		res.render("transactions",{t:transaction});
	});
});

app.listen(process.env.PORT || 3000,process.env.IP,()=>{
	console.log("TSF Banking Server has started...");
});