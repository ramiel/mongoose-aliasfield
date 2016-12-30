var _ = require('lodash');
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

function _flattenObject(ob) {
    var toReturn = {};
    var flatObject;
    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) {
            continue;
        }
        if (_.isPlainObject(ob[[i]])) {
            flatObject = _flattenObject(ob[i]);
            for (var x in flatObject) {
            if (!flatObject.hasOwnProperty(x)) {
                continue;
            }
            toReturn[i + (!!isNaN(x) ? '.' + x : '')] = flatObject[x];
        }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

function _toShortFieldsObjectProvider(schema){
    return function toShortFieldsObject(ob){
        var flatten = _flattenObject(ob);
        var shortObject = {};
        for(var key in flatten){
            var set = false;
            schema.eachPath(function(path, def){
                if(!_.isUndefined(def.options.alias) && def.options.alias === key){
                    shortObject[path] = flatten[key];
                    set = true;
                }
            });
            if(!set){
                shortObject[key] = flatten[key];
            }
        }
        var document = {};
        for(var i in shortObject){
            _propertyInflector(document, i.split('.'), shortObject[i]);
        }
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
            if(this.get(property.path) !== undefined){
                var options = property.caster ? property.caster.options : property.options;
                if( options.alias && 'string' == typeof options.alias && options.alias !== ''){
                    var alias = options.alias.split('.');
                    _propertyInflector(document,alias, this.get(property.path) );
                }else{
                    document[property.path] = this.get(property.path);
                }
            }
        }
        return document;
    };
}


/**
 * Convert the name of a single alised field back to the original name
 * @param {Object}Schema schema to modify
 * @returns {Function} Methods (Mongoose intended) for schema
 */
function _toOriginalFieldFromAlias(schema){
    return function toOriginalFieldFromAlias(key){
        var originalName = key;

        schema.eachPath(function(path, def){
            if(!_.isUndefined(def.options.alias) && def.options.alias === key){
                originalName = path;
            }
        });

        return originalName;
    };
}

function getter_helper(prop){
    return function(){
        return this.get(prop);
    };
}

function setter_helper(prop){
    return function(value){
        return this.set(prop, value);
    };
}


module.exports = exports = function fieldsAliasPlugin(schema, options) {

    for(var path in schema.paths){
        /*Set alias name only if alias property is setted in schema*/
        if( schema.paths[path].options.alias && 'string' == typeof schema.paths[path].options.alias && schema.paths[path].options.alias !== ''){
            var aliased_property = schema.paths[path].options.alias;
            var real_property = schema.paths[path].path;

            //Adding getters and setters for virtual alias names
            schema
                .virtual(aliased_property)
                .get(getter_helper(real_property))
                .set(setter_helper(real_property));
        }
    }

    /*Adding method toAliasedFieldsObject to schema*/

    schema.methods.toAliasedFieldsObject = _toAliasedFieldsObjectProvider(schema);
    schema.statics.toOriginalFieldsObject = _toShortFieldsObjectProvider(schema);
    schema.statics.toOriginalFieldFromAlias = _toOriginalFieldFromAlias(schema);
};
