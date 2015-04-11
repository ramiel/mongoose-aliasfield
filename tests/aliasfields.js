var fieldsAliasPlugin = require('../lib/field-alias-plugin'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mocha = require('mocha'),
    chai = require('chai'),
    assert = chai.assert;

describe('Aliased fields',function(){

    before(function connection(done){
        mongoose.connection.on('open',done);
        mongoose.connection.on('error',done);
        mongoose.connect('mongodb://127.0.0.1/testing');
    });

    after(function(done){
        mongoose.connection.db.dropDatabase(function(err, result) {
            mongoose.disconnect(done);
        });
    });

    describe('creating a test schema with aliased fields',function(){

        before(function create_schema(){
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
            this.TestModel = mongoose.model('test', TestSchema);
        });

        it('model gained toAliasedFieldsObject method', function(){
            var t = new this.TestModel();
            assert.isFunction(t.toAliasedFieldsObject);
        });

        

        describe('after generating a model instance',function(){

            before(function create_instance(done){
                this.t = new this.TestModel({
                    'timestamp' : new Date(),
                    'v'     : 15,
                    'external.minimum': 30,
                    'aldo.bice.david' :'hello'
                });
                this.t.save(done);
            });

            it('has aliased properties', function(){
                var instance = this.t;
                assert.equal(instance.external.minimum, 30);
                assert.equal(instance.aldo.bice.david, 'hello');
                var i = instance.toAliasedFieldsObject();
                assert.property (i, 'timestamp');
            });

            it('hasn\'t not aliased properties which are mantained unaltered',function(){
                var i = this.t.toAliasedFieldsObject();
                assert.property(i, 'v');
            });

            it('hasn\'t getter for properties which have not a value',function(){
                var i = this.t.toAliasedFieldsObject();
                assert.isUndefined(i.aldo.bice.carlo);
            });

        });
    });

    describe('creating a test schema with an external reference',function(){

        before(function create_schema_with_reference(done){
            this.Person = null;
            this.parent = null;
            var PersonSchema = new Schema({
                'n' : {'type' : String, 'required' : true, alias: 'name'},
                'c' : {'type': Schema.Types.ObjectId, ref: 'person', alias: 'child' }
                
            });
            PersonSchema.plugin(fieldsAliasPlugin);
            this.Person = mongoose.model('person', PersonSchema);

            var children = new this.Person({name: 'Tim'});
            
            children.save(function(err){
                if(err) return done(err);
                this.parent = new this.Person({name: 'Mike', child: children._id });
                this.parent.save(done);
            }.bind(this));
        });

        it('using population aliased fields are mantained',function(done){
            this.found_parent = null;
            this.Person
                .findOne({n: 'Mike'})
                .populate('c')
                .exec(function(err, person){
                    if(err) return done(err);
                    this.found_parent = person;
                    assert.isFunction(person.toAliasedFieldsObject);
                    assert.isFunction(person.child.toAliasedFieldsObject);
                    assert.equal(person.name, 'Mike');
                    assert.equal(person.child.name, 'Tim');
                    done();
                }.bind(this));
        });

        it('applying "toAliasedFieldsObject" to referenced model is possible',function(){
            var t = this.found_parent.child.toAliasedFieldsObject();
            assert.equal(t.name, 'Tim');
        });

    });

});