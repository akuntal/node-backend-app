'use strict';
var mongoose = require('mongoose'),
Schema = mongoose.Schema,
bcrypt = require('bcrypt'),
SALT_WORK_FACTOR = 10;

var userSchema = new Schema({
	name:String,
	username:{type:String, required:true, unique:true},
	password:{type:String, required:true},
	created_at:Date,
	updated_at:Date
})

userSchema.pre('save',()=>{
	let user = this;
	if(!user.isModified('password')) return next();
	bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt)=>{
		if(err) return next(err);
		bcrypt.hash(user.password, salt, (err, hash)=>{
			if(err) return next(err);
			
			//overriding password text with hashed one
			user.password = hash;
			next();
		})
	})
})

var User = mongoose.model('User', userSchema);
module.exports = User;