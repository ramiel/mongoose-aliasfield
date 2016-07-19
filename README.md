mongoose-aliasfield
===================

[![Build Status](https://travis-ci.org/ramiel/mongoose-aliasfield.svg?branch=master)](https://travis-ci.org/ramiel/mongoose-aliasfield)
[![Dependency Status](https://david-dm.org/ramiel/mongoose-aliasfield.svg)](https://david-dm.org/ramiel/mongoose-aliasfield)
[![devDependency Status](https://david-dm.org/ramiel/mongoose-aliasfield/dev-status.svg)](https://david-dm.org/ramiel/mongoose-aliasfield#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/ramiel/mongoose-aliasfield/badge.svg?branch=master&service=github)](https://coveralls.io/github/ramiel/mongoose-aliasfield?branch=master)

Discover on [Ramiel's creations](http://www.ramielcreations.com/projects/alias-fields-plugin-for-mongoose/ "Ramiel's creations page")

This plugin let you add a `alias` key to your schema and create getter and setter for your field using that alternate name.

Plugin is intended to write short-keys for you documents on the DB but let you use long, descriptive name when reading fetched documents.
This will result in less storage needed to memorize your data having no need to remember short key meanings.

## Installation

To install it in your node.js project

```
npm install mongoose-aliasfield
```

or add it to your package.json dependencies

## Schema Example

Take this schema as example:

```javascript
var mongoose = require('mongoose');
var fieldsAliasPlugin = require('mongoose-aliasfield');

/*Describe a Schema*/
var PersonSchema = new Schema({
	't' : {'type': Date, 'index': true, 'alias': 'timestamp'},
	'n' : {'type' : String, 'alias': 'name'},
	's' : {'type' : String, 'alias': 'surname'},
	'p' : {
		'a' : {'type' : String, 'alias': 'profile.address'},
		'pn': {'type' : String, 'alias': 'profile.phone_number'}
	}
});

/*Add field alias plugin*/
PersonSchema.plugin(fieldsAliasPlugin);

/*Person will be the model*/
```

Now that your `schema` is created you can use alias field name to describe an instance of your model

```javascript
var person = new Person({
	'timestamp'	: new Date(),
	'name'		: 'Jhon',
	'surname'	: 'Doe',
	'profile.address': 'Rue de Morgane',
	'profile.phone_number': '051-123456 78',
});

person.save();

```

Even getters will run out of the box

```javascript
var full_name = person.name+' '+person.surname;
```

`full_name` will be `Jhon Doe`

The only limitation in setters and getters is that you can't use partial path for nested properties

```javascript
/*THIS WON'T ACT AS EXPECTED!*/
var user_profile = person.profile;
```

You'll be able to obtain even an aliased description of object as i the example below

```javascript
Person.findOne({'n': 'Jhon'}, function(err,person){
	console.log( person.toAliasedFieldsObject() );
});

```
Your models gain a method called `toAliasedFieldsObject` which return a long-descriptive version of your docs:

```javascript
{
	'name'	: 'Jhon',
	'surname': 'Doe',
	'profile': {
		'address' 		: 'Rue de Morgane',
		'phone_number'	: '051-123456 78'
	}
}
```

The same is applyable to an array of results

```javascript
Person.find({}, function(err,people){
	people = people.map(function(p){
		return p.toAliasedFieldsObject();
	});
});

```

## Utilities

### Transform between representations

Sometimes you want to do some operation but you have just the aliased representation of an instance. Consider the following example:

```js
var PersonSchema = new Schema({
    n : {type : String, required : true, alias: 'name'},
    a : {
        s: {type: String, alias: 'address.street' },
        d: {type: Date, alias: 'address.date'}
    },
    likes: {type: Number}
    
});
PersonSchema.plugin(fieldsAliasPlugin);
this.Person = mongoose.model('person', PersonSchema);
```

let's say you want to do an update

```js
var data = {
	name: 'John',
	address: {
		street: 'Avenue ...',
		date: new Date()
	},
    likes: 5
}
Person.update({name: 'John'}, data, function(){
	...
});
```
This won't work because mongoose is not able to understand the aliases.    
Your model has a static method which help you to move from an aliased representation of your data to the one you have on the database.   
You can write

```js
Person.update({name: 'John'}, Person.toOriginalFieldsObject(data), function(){
    ...
});
```
Edge case: you cannot transform mixed representation. All the properties which have an alias must be represented with the alias.    
In our example this won't work:

```js
var data = {
    name: 'John',
    address: {
        s: 'Avenue ...',
        d: new Date()
    },
    likes: 5
}
Person.toOriginalFieldsObject(data); // This will result in an invalid object
```
here we are mixing `address` (aliased) and `s` (not aliased), which is not permitted.
`toOriginalFieldsObject` can be expensive, so use it only if you're forced to

## Author

Fabrizio 'ramiel' Ruggeri
