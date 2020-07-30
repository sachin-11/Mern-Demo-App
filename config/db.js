const mongoose = require('mongoose');
const config = require('config');

const db = config.get('mongoURI');


const connectDB = async () => {
    try {

      await  mongoose.connect(db, {
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useNewUrlParser: true
        })
        console.log('Connected to Database')
        
    } catch (error) {
       console.error(error.message);
      //exits
      process.exit(1); 
    }
}

module.exports = connectDB;