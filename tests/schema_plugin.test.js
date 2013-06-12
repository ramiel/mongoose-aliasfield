var fieldsAliasPlugin = require('../lib/field-alias-plugin'),
	vows = require('vows'),
	assert = require('assert'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	EventEmitter = require('events').EventEmitter;

var suite = vows.describe("Testing Schema creation, getters and setters");

suite.addBatch({
	'Connecting to Mongoose' : {
		topic : function(){
			var connectionPromise = new(EventEmitter);
			
			mongoose.connection.on('open',function(){
				connectionPromise.emit('success',null);
			});
			mongoose.connection.on('error',function(){
				connectionPromise.emit('error',new Error());
			});
			mongoose.connect('mongodb://127.0.0.1/testing');
			return connectionPromise;
		},
		'and mongoose connected' : function(e){
			assert.isNull(e);
		},
		'and after schema creation and plugin application':{
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
	}	
}).export(module);