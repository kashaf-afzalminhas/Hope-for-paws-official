const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Name cannot be empty'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  age: {
    type: Number,
    required: true,
    min: [0, 'Age must be a positive number']
  },
  petType: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Pet type cannot be empty'],
    maxlength: [50, 'Pet type cannot exceed 50 characters']
  },
  breed: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Breed cannot be empty'],
    maxlength: [100, 'Breed cannot exceed 100 characters']
  },
  vaccinated: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  neuteredSpayed: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Description cannot be empty'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  imageUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'adopted'],
    default: 'available'
  },
  requests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionRequest'
  }],
  location: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Location cannot be empty'],
    maxlength: [200, 'Location cannot exceed 200 characters'],
    default: 'Location not specified'
  }
}, { timestamps: true });

const Adoption = mongoose.model('Adoption', adoptionSchema);

module.exports = Adoption;