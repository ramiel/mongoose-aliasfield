mongoose-aliasfield
===================

Discover on [Ramiel's creations](http://www.ramielcreations.com/projects/alias-fields-plugin-for-mongoose/ "Ramiel's creations page")

This plugin let you add a `alias` key to your schema and create getter and setter for your field using that alternate name.

Plugin is intended to write short-keys for you documents on the DB but let you use long, descriptive name when reading fetched documents.
This will result in less storage needed to memorize your data having no need to remember short key meanings.

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

```
Person.find({'name': 'Jhon'}, function(err,people){
	console.log( people.toAliasedFieldsObject() );
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

## Author

Fabrizio 'ramiel' Ruggeri