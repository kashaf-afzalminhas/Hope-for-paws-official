var express = require('express');
var router = express.Router();

require('./db/connection');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send(("Hello"));
})
// Export the router using CommonJS
module.exports = router;