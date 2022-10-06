const mongoose = require('mongoose');
//phone book
const schema = mongoose.Schema({
    user:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    Name:{
        type:String,
        required: true
    },
   Tel:{
    type: Number,
    required: true
   },
   created_at: {type : Date, default: new Date()}
})


module.exports =  mongoose.model('PhoneBook', schema)