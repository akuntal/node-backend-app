const express = require('express');
const app = express();

var router = require('./src/app');

app.use('/api', router);

app.get('/', (req, res)=>{
	res.send('mongodb backend app');
})

app.listen(3001,()=>{
	console.log('App listening on port 3001')
})
