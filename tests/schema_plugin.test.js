var fieldsAliasPlugin = require('../lib/field-alias-plugin'),
	//datasource = require('../lib/models/datasource'),
	//mongoose = datasource.mongoose,
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;


mongoose.connect('127.0.0.1', 'test', 27017);

var TestSchema = new Schema({
	't' : {'type': Date, 'default': new Date(), 'alias': 'timestamp'},
	'v' : {'type' : Number, 'required' : true},
	'ext' : {
		'min' : {'type':Number, 'alias':'external.minimum'}
	},
	'a':{
		'b':{
			'c': {type:Number, alias:'aldo.bice.carlo'}
		}
	}
});


TestSchema.plugin(fieldsAliasPlugin);

mongoose.model('test', TestSchema);
var Test = mongoose.model('test');

var t = new Test({
	'timestamp'	: new Date(),
	'v'		: 15,
	'external.minimum': 30
});

t.save(function(err,saved){
	console.log('saved: ',saved.toAliasedFieldsObject());
//	console.log('checking for key aldo.bice.carlo: ',saved.aldo.bice.carlo);
//	console.log('checking for key aldo.bice: ',saved.aldo.bice);
//	console.log('checking for key aldo: ',saved.aldo);
//	console.log(saved.toObject());
	mongoose.disconnect();
});




