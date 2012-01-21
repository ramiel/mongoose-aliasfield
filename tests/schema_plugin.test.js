var fieldsAliasPlugin = require('../lib/field-alias-plugin'),
	vows = require('vows'),
	assert = require('assert'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var suite = vows.describe("Testing Schema creation, getters and setters");

mongoose.connect('127.0.0.1', 'test', 27017);

suite.addBatch({
	'After schema creation and plugin application':{
		topic: function(){
			var TestSchema = new Schema({
				't' : {'type': Date, 'default': new Date(), 'alias': 'timestamp'},
				'v' : {'type' : Number, 'required' : true},
				'ext' : {
					'min' : {'type':Number, 'alias':'external.minimum'}
				},
				'a':{
					'b':{
						'c': {type:Number, alias:'aldo.bice.carlo'},
						'd': {type:String, alias:'aldo.bice.david'}
					}
				}
			});
			TestSchema.plugin(fieldsAliasPlugin);
			mongoose.model('test', TestSchema);
			var Test = mongoose.model('test');
			return Test;
		},
		'schema gained toAliasedFieldsObject method': function(Model){
			var t = new Model();
			assert.isFunction(t.toAliasedFieldsObject);
		},
		'and after generating a new model instance': {
			topic: function(Test){
				var t = new Test({
					'timestamp'	: new Date(),
					'v'		: 15,
					'external.minimum': 30,
					'aldo.bice.david' :'hello'
				});
				return t.save(this.callback);
			},
			'instance has aliased field': function(err,instance){
				assert.isNull(err);
				assert.equal(instance.external.minimum, 30);
				assert.equal(instance.aldo.bice.david, 'hello');
				var i = instance.toAliasedFieldsObject();
				assert.include (i, 'timestamp');
			},
			'and not aliased fields are mantained': function(err,instance){
				var i = instance.toAliasedFieldsObject();
				assert.include (i, 'v');
			},
			'and not filled fields are not included in getter': function(err,instance){
				var i = instance.toAliasedFieldsObject();				
				assert.typeOf (i.aldo.bice.carlo, 'undefined');
			}
		}
	}
	
}).export(module);



//
//mongoose.model('test', TestSchema);
//var Test = mongoose.model('test');
//

//
//t.save(function(err,saved){
//	console.log('saved: ',saved.toAliasedFieldsObject());
////	console.log('checking for key aldo.bice.carlo: ',saved.aldo.bice.carlo);
////	console.log('checking for key aldo.bice: ',saved.aldo.bice);
////	console.log('checking for key aldo: ',saved.aldo);
////	console.log(saved.toObject());
//	mongoose.disconnect();
//});




