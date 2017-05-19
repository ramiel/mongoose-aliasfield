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

    describe('creating a test schema with array properties',function(){

        before(function create_schema(done){
            var TestSchema = new Schema({
                't' : [{'type': Date, 'default': new Date(), 'alias': 'timestamp'}]
            });
            TestSchema.plugin(fieldsAliasPlugin);
            this.TestModel = mongoose.model('testarrays', TestSchema);
            this.t = new this.TestModel({
                'timestamp' : [new Date()]
            });
            this.t.save(done);
        });

        it('has aliased properties', function(){
            var i = this.t.toAliasedFieldsObject();
            assert.property (i, 'timestamp');
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

    describe('Transforming aliased objects to original names', function(){
        before(function(){
            var PersonSchema = new Schema({
                n : {type : String, required : true, alias: 'name'},
                a : {
                    s: {type: String, alias: 'address.street' },
                    d: {type: Date, alias: 'address.date'}
                },
                likes: {type: Number}

            });
            PersonSchema.plugin(fieldsAliasPlugin);
            this.Person = mongoose.model('person_transforming', PersonSchema);
        });

        it('works with primitive', function(){
            var ex1 = {name: 'John', address: {street: 'Rue Morand'}};
            var flatten = this.Person.toOriginalFieldsObject(ex1);
            assert.deepEqual(flatten, { n: 'John', a: {s: 'Rue Morand'} });
        });

        it('works with dates', function(){
            var date = new Date();
            var ex2 = {name: 'John', address: {street: 'Rue Morand', date: date}};
            var flatten = this.Person.toOriginalFieldsObject(ex2);
            assert.deepEqual(flatten, { n: 'John', a: {s: 'Rue Morand', d: date}});
        });

        it('preserves null values', function(){
            var ex3 = {name: 'John', address: {street: 'Rue Morand', date: null}};
            var flatten = this.Person.toOriginalFieldsObject(ex3);
            assert.deepEqual(flatten, { n: 'John', a: {s: 'Rue Morand', d: null}});
        });

        it('works with properties which have no alias', function(){
            var ex4 = {name: 'John', address: {street: 'Rue Morand'},likes: 5};
            var flatten = this.Person.toOriginalFieldsObject(ex4);
            assert.deepEqual(flatten, { n: 'John', a: {s: 'Rue Morand'}, likes: 5 });
        });

        it('do not works with mixed representations', function(){
            var ex4 = {n: 'John', address: {s: 'Rue Morand'},likes: 5};
            var flatten = this.Person.toOriginalFieldsObject(ex4);
            assert.notEqual(flatten, { n: 'John', a: {s: 'Rue Morand'}, likes: 5 });
        });
    })

    describe('Transforming aliased property to original name', function(){
        before(function(){
            var PersonSchema = new Schema({
                n : {type : String, required : true, alias: 'name'},
                a : {
                    s: {type: String, alias: 'address.street' },
                    d: {type: Date, alias: 'address.date'}
                },
                likes: {type: Number}

            });
            PersonSchema.plugin(fieldsAliasPlugin);
            this.Person = mongoose.model('aliased_property_test', PersonSchema);
        });

        it('works top level property', function(){
            var flatten = this.Person.toOriginalFieldFromAlias('name');
            assert.equal(flatten, 'n');
        });

        it('works sub level property', function(){
            var flatten = this.Person.toOriginalFieldFromAlias('address.street');
            assert.equal(flatten, 'a.s');
        });

        it('works non-aliased property', function(){
            var flatten = this.Person.toOriginalFieldFromAlias('likes');
            assert.equal(flatten, 'likes');
        });
    })

});
