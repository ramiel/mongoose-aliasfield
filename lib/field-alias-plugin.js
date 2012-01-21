/**
 * Mongoose Plugin to alias fields name
 * Schema gains a property: 'alias' which is long name for a property. It will be used as getter and setter
 * Limitation. For deep nested properties only the entire property is get/set-table
 * @param schema
 * @param options
 */


/**
 * Dinamically set an array-descripted property into an object
 * Es: [key,to,set] => obj{key:{to:{set: value} } }
 * @param {Object} document Object to enrich. Note that document will be modified
 * @param {Array} property Array descripted property. If property is p='key.to.set' simply pass  p.split('.')
 * @param {Any} value Value to set at the end of key chain
 */
function _propertyInflector(document, property ,value){
	if(property.length > 1){
		document[property[0]] = document[property[0]] || {};
		return _propertyInflector( document[property[0]], property.slice(1), value);
	}else{
		document[property[0]] = value;
		return document;
	}
}

/**
 * Give a instance method to retrieve object using aliased field 
 * @param {Object}Schema schema to modify
 * @returns {Function} Methods (Mongoose intended) for schema
 */
function _toAliasedFieldsObjectProvider(schema){
	
	return function toAliasedFieldsObject(){
		var document = {};		
		for(var p in schema.paths){
			var property = schema.paths[p]; 
//			console.log('evaluating '+property.path,this.get(property.path) === undefined);
			if(this.get(property.path) !== undefined){
				if( property.options.alias && 'string' == typeof property.options.alias && property.options.alias != ''){
					var alias = property.options.alias.split('.');
					_propertyInflector(document,alias, this.get(property.path) );
				}else{
					document[property.path] = this.get(property.path);
				}
			}
		}
		return document;
	};
}


module.exports = exports = function fieldsAliasPlugin(schema, options) {
	
	for(path in schema.paths){
		/*Set alias name only if alias property is setted in schema*/
		if( schema.paths[path].options.alias && 'string' == typeof schema.paths[path].options.alias && schema.paths[path].options.alias != ''){
			var aliased_property = schema.paths[path].options.alias;
			var real_property = schema.paths[path].path;
			
			//Adding getters and setters for virtual alias names
			schema
				.virtual(aliased_property)
				.get((function(prop){
								return function(){
									return this.get(prop);
								};
					})(real_property))
				.set((function(prop){
								return function(value){
									return this.set(prop, value);
								};
					})(real_property)
				);
		}
	}
	
	/*Adding method toAliasedFieldsObject to schema*/
	
	schema.methods.toAliasedFieldsObject = _toAliasedFieldsObjectProvider(schema);
	
};