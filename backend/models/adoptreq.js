const mongoose = require('mongoose');

const adoptReqSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true
  },
  lname: {
    type: String,
    required: true
  },
  animal: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  cnic: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  petHistoryImage: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdoptReq', adoptReqSchema); 