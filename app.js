if(process.env.NODE_ENV != 'production'){
    require('dotenv').config();
}

// console.log(process.env);
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride= require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError= require("./utils/expressError.js");
const session = require("express-session")
const MongoStore =require("connect-mongo")
const flash = require("connect-flash")
const passport = require("passport")
const localStrategy = require("passport-local")
const User = require("./models/user.js")
const Reservation = require('./models/reservation');
const Listing = require("./models/listing.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.use(express.json()); 
app.use(methodOverride("_method"))
app.set("view engine","ejs");
app.set("views" ,path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate)
app.use(express.static(path.join(__dirname,"public")));

// const MONGO_URL = "mongodb://127.0.0.1:27017/Wanderlust";

const dbURL=process.env.ATLASDB_URL;

main()
   .then(() => {
       console.log("connected to DB");
    })
   .catch((err) => {
       console.log(err)
    })

async function main(){
    await mongoose.connect(dbURL);
}

const store = MongoStore.create({
    mongoUrl : dbURL,
    crypto: {
        secret : process.env.SECRET,
    },
    touchAfter: 24 * 3600,
})

store.on("error",() =>{
    console.log("ERROR in Mongo Session", err);
})

const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie :{
    expires: Date.now() + 7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true,
    }
}

app.use(session(sessionOptions))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req,res,next) =>{
   res.locals.success = req.flash("success")
   res.locals.error = req.flash("error")
   res.locals.currUser = req.user;
   next()  
})

app.use("/listings" , listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/",userRouter)
app.get('/', (req, res) => {
    res.render('listings/home.ejs');
});
app.get('/home', (req, res) => res.render('listings/home'));  
app.get('/about', (req, res) => res.render('listings/home'));   

app.get("/search", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        // Find properties matching the title (case insensitive)
        const results = await Listing.find({ 
            title: { $regex: query, $options: "i" }
        }).limit(10); // Limit results

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// app.all("*" ,(req,res,next) => {
//     next(new ExpressError(404 ,"Page Not Found"));
// })
//Error handler
app.use((err,req,res,next) =>{
    let {status =500 ,message = "Error"}=err
    res.render("error.ejs" ,{err})
    //res.status(status).send(message)
})
app.listen(8080 , () => {
    console.log("Server is running on port 8080");
});

