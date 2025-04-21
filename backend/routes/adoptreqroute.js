<<<<<<< HEAD
//------const express = require('express');
//------const Adoptcontroller = require('../controllers/adoptreqcontroller');
const AdoptReq = require('../models/adoptreq');

//------const app = express();
//------const router = express.Router();

//mongoose.connect("mongodb://127.0.0.1:27017/Adoptions");))
// Middleware to parse JSON request bodies
//-------app.use(express.json());

/*app.post('/submit', async (req, res) => {
    const { fname, lname, animal,owner,address,number,cnic,createdAt,reason } = req.body;
    const newData = new Data({
        fname, 
        lname, 
=======
// /routes/adoptreqroute.js
const express = require('express');
const router = express.Router();
const AdoptReq = require('../models/adoptreq'); // Import the AdoptReq model

// Route to handle POST requests to create an adoption request
router.post('/', async (req, res) => {
    // Destructure data from the request body
    const { fname, lname, animal, owner, address, number, cnic, reason } = req.body;

    // Validate the data (check if all fields are provided)
    if (!fname || !lname || !animal || !owner || !address || !number || !cnic || !reason) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Create a new adoption request entry
    const newAdoptReq = new AdoptReq({
        fname,
        lname,
>>>>>>> 37331b43ffca00de6551be2034f6bfb33eb19237
        animal,
        owner,
        address,
        number,
        cnic,
<<<<<<< HEAD
        createdAt,
        reason
    });

    try {
        await newData.save();
        res.json({ message: 'Data saved successfully' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
      }
    });
    
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });*/

    //-------router.get('/', Adoptcontroller.getadoptreq);


//------module.exports = router;
const express = require('express');
const router = express.Router();
//-----const Adoptcontroller = require('../controllers/adoptreqcontroller');
const adoptreqcontroller = require('../controllers/adoptreqcontroller');

// Route to handle adoption request submissions
router.post('/', adoptreqcontroller.createAdoptionRequest);
//------router.get('/', async (req, res) => {
  router.post('/', async (req, res) => {
    //------const adoptreq = await Adoptcontroller.getadoptreq();
    const { fname, lname, animal, owner, address, number, cnic, reason } = req.body;
  const newAdoptReq = new AdoptReq({
    fname,
    lname,
    animal,
    owner,
    address,
    number,
    cnic,
    reason,
  });
  //----const adoptreq = await Adoptcontroller.getadoptreq(req.body);
  //-----res.status(200).json(adoptreq);
  //-----} catch (error) {
  //------ res.status(500).json({ message: error.message });
  try {
    await newAdoptReq.save();
    res.status(201).json({ message: 'Request submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});
    module.exports = router;
=======
        reason,
    });

    // Save the new adoption request to the database
    try {
        await newAdoptReq.save();
        res.status(201).json({ message: 'Request submitted successfully' });
    } catch (err) {
        console.error("Error while processing adoption request:", err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Export the router to be used in your main app
module.exports = router;
>>>>>>> 37331b43ffca00de6551be2034f6bfb33eb19237
