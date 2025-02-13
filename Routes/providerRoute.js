const router = require('express').Router();
const {create} = require('../Controllers/provider.controller');


router.post('/register', create);

module.exports = router;