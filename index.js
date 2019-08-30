const express = require('express');
const morgan = require('morgan');
//const cors = require('cors')
const mongoose = require('mongoose');

var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
// for parsing application/json
app.use(express.json()) 
// for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true })) 


app.use(morgan('combined')); 
//app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/shopping',{useNewUrlParser: true});

const userSchema = new mongoose.Schema({
        userName: String, 
        password: String, 
        firstName: String, 
        lastName: String 
    },
    { 
        collection: 'users' 
    }
);
let User = mongoose.model('User', userSchema);


app.get('/api/users', (req, res) => {
    res.json({
        message: 'Welcome to the API'
    })
});

// curl -X POST http://localhost:3000/api/register -d "{\"userName\":\"NZ\",\"firstName\":\"Nizo\",\"lastName\":\"Ahmed\",\"password\":\"pwd\"}" -H "Content-Type: application/json"
app.post('/api/register', function (req, res, next) {
    let BCRYPT_SALT_ROUNDS = 12;
    let userName =  req.body.userName;
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let password = req.body.password;
    
    bcrypt.hash(password, BCRYPT_SALT_ROUNDS).then(function(hashedPassword) {
    var user = new User({
        userName:userName,
        password:hashedPassword,
        firstName:firstName,
        lastName:lastName
    });

    user.save(function(err,data){
        res.sendStatus(200);
    });
})
});


// curl -X POST http://localhost:3000/api/login -d "{\"userName\":\"NZ\",\"password\":\"pwd\"}" -H "Content-Type: application/json"
app.post('/api/login', async function (req, res) {
    var userName = req.body.userName;
    var password = req.body.password;
    try{
        const user = await User.findOne({ userName });

        if (user) {
            bcrypt.compare(password, user.password, function (err, result) {
                if (result == true) { 
                    jwt.sign({_id: user._id}, 'secretkey', (err, token) => {
                        res.json({ token });
                    });  
                } 
                else {
                    res.sendStatus(404);
                }
            });
        } else {
            res.sendStatus(400);
        }
    } 
    catch(error){
    }
}); 

// curl -X GET -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDY3ZWE1ZjkwNjE5ZDE2MGNkYzRlOGIiLCJpYXQiOjE1NjcwOTE1NjB9.lkpbedgyh0TVPdUnvhlsbjveAAdOrtn53R40fS4IdWE" -H "Cache-Control: no-cache" "http://localhost:3000/api/users"
app.get('/api/users',verifyToken, (req, res) => {
    User.find({}, function(err, data){
        res.json(data);
    });
});

app.post('/api/posts', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if(err) {
            res.sendStatus(403);
        } else {
            res.json({
                message: 'Post Created',
                authData
            });
        }
    });
});
////////////////////////////////////////////////////////////////////////////////

// FORMAT OF TOKEN
// Authorization: Bearer <access_token>
function verifyToken(req, res, next){
    // Get auth header value
    const bearerHeader = req.headers['authorization'];

    // Check if bearer is undefined
    if(typeof bearerHeader !== 'undefined') {
        // Split token from array
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);  // Forbidden
        //res.status(403).send('Forbidden') ;
    }
}
app.listen(3000,  () => console.log('Server started on port 3000'));
