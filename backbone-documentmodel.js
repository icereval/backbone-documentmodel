/**
 *
 * Backbone.DocumentModel v0.0.1
 *
 * Copyright (c) 2013 Michael Haselton & Aaron Herres, Loqwai LLC
 *
 * https://github.com/icereval/backbone-documentmodel
 * Licensed under the MIT License
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['underscore', 'backbone'], factory);
    } else {
        // globals
        factory(_, Backbone);
    }
}(function (_, Backbone) {
    function documentCollectionGet(obj) {
        if (this.pseudoIdAttribute) {
            return this.findWhere({value: obj});
        }

        return Backbone.Collection.prototype.get.call(this, obj);
    }

    function documentModelGet(property) {
        if (!_.isString(property)) {
            return Backbone.Model.prototype.get.call(this, property);
        }

        var properties = _.isArray(property) ? property : property.split('.');
        var retVal = Backbone.Model.prototype.get.call(this, properties.shift());

        _.each(properties, function (prop) {
            var parseIntProp = parseInt(prop, 10);

            if (_.isNumber(parseIntProp) && _.isFinite(parseIntProp)) {
                retVal = retVal.at(parseIntProp);
            } else {
                retVal = retVal.get(prop);
            }
        });

        return retVal;
    }

    function documentCollectionSet(models, options) {
        options || (options = {});
        _.extend(options, _.pick(this, ['idAttribute']));
        if (!_.isArray(models)) models = models ? [models] : [];

        // Model's within Collections do not store parent/name, this can be accessed
        // through the model's collection attribute.
        delete options.name;
        delete options.parent;

        if (models.length > 0) {
            if (!_.isObject(models[0])) {
                this.pseudoIdAttribute = true;

                models = _.map(models, function (value) {
                    var model = {};

                    model[options.idAttribute] = _.uniqueId();
                    model.value = value;

                    return model;
                });
            }
        }

        Backbone.Collection.prototype.set.call(this, models, options);

        return this;
    }

    function documentModelSet(key, val, options) {
        var nestedAttrs = {};
        var deepNamedAttrs = {};

        if (key == null) return this;

        // Handle both `"key", value` and `{key: value}` -style arguments.
        if (typeof key === 'object') {
            attrs = key;
            options = val;
        } else {
            (attrs = {})[key] = val;
        }

        options || (options = {});

        _.each(_.keys(attrs), function (attrKey) {
            if (attrKey.indexOf('.') > 0) {
                deepNamedAttrs[attrKey] = attrs[attrKey];
                delete attrs[attrKey];
            } else if (_.isObject(attrs[attrKey])) {
                nestedAttrs[attrKey] = attrs[attrKey];
                delete attrs[attrKey];
            }
        });

        Backbone.Model.prototype.set.call(this, attrs, options);

        // Handle Deep Named Attributes - ex: { 'name.first': 'Joe' }
        _.each(_.keys(deepNamedAttrs), function (deepAttrKey) {
            var origDeepAttrValue = this.get.call(this, deepAttrKey);

            if (!_.isEqual(origDeepAttrValue, deepNamedAttrs[deepAttrKey])) {
                var splitDeepAttrKey = deepAttrKey.split('.');
                var deepAttrName = splitDeepAttrKey.pop();

                var deepAttrParentName = _.reduce(splitDeepAttrKey, function (memo, val) {
                    return memo + '.' + val;
                });

                var deepAttrParent = this.get.call(this, deepAttrParentName);
                deepAttrParent.set(deepAttrName, deepNamedAttrs[deepAttrKey], options);
            }
        }, this);

        // Handle Nested Attribute Creation - ex: { name: { first: 'Joe' } }
        _.each(_.keys(nestedAttrs), function (nestedAttrKey) {
            var nestedOptions = { parent: this };
            _.extend(nestedOptions, _.pick(this, ['idAttribute']));
            nestedOptions.name = nestedAttrKey;

            if (_.isArray(nestedAttrs[nestedAttrKey])) {
                // Collection
                Backbone.Model.prototype.set.call(this, nestedAttrKey, new Backbone.DocumentCollection(nestedAttrs[nestedAttrKey], nestedOptions), options);
            } else {
                // Model
                if (this instanceof Backbone.DocumentModel) {
                    // Model -> Model

                    if (!nestedAttrs[nestedAttrKey][this.idAttribute]) {
                        // If no id has was specified for the nested Model, use it's parent id.
                        // This is required for patching updates and will be omitted on JSON build.
                        nestedAttrs[nestedAttrKey][this.idAttribute] = this.get(this.idAttribute);
                        nestedOptions.pseudoIdAttribute = true;
                    }
                }

                Backbone.Model.prototype.set.call(this, nestedAttrKey, new Backbone.DocumentModel(nestedAttrs[nestedAttrKey], nestedOptions), options);
            }
        }, this);
    }

    function documentToJSON() {
        var omitList = [];
        var response;

        if (this instanceof Backbone.Collection) {
            var models = this.models;
            response = [];

            _.each(_.keys(models), function (modelKey) {
                var modelValues = models[modelKey].toJSON();

                if (this.pseudoIdAttribute) {
                    modelValues = modelValues.value;
                }

                response.push(modelValues);
            }, this);
        } else if (this instanceof Backbone.Model && this.attributes) {
            var attributes = this.attributes;
            response = {};

            _.each(_.keys(attributes), function (attrKey) {
                if (attributes[attrKey] instanceof Backbone.Model || attributes[attrKey] instanceof Backbone.Collection) {
                    omitList.push(attrKey);
                }
            });

            // clear pseudo parent id reference.
            if (this.pseudoIdAttribute) {
                delete attributes[this.idAttribute];
            }

            response = _.omit(attributes, omitList);

            _.each(omitList, function (omitKey) {
                response[omitKey] = attributes[omitKey].toJSON();
            });
        }

        return response;
    }

    function documentEvents(eventName) {
        var eventSplit = eventName.split(':');
        var eventType = eventSplit[0];
        var eventAttrs = eventSplit.length > 1 ? _.last(eventSplit, eventSplit.length - 1)[0].split('.') : [];
        var args = Array.prototype.slice.call(arguments, 0);

        console.log('DocumentEvent:event:this (' + this.name + ') [' + (this instanceof Backbone.Model ? 'M' : 'C') + ']:' + eventName);

        if (eventName === 'change') {
            return;
        }

        // Only trigger events on Models, Collections automatically replicate Child Model events.
        eventAttrs.unshift(this.name);

        var event = _.reduce(eventAttrs, function (memo, val) {
            return memo + '.' + val;
        });

        args[0] = eventType + ':' + event;

        console.log('DocumentEvent:trigger:this (' + this.name + ') [' + (this instanceof Backbone.Model ? 'M' : 'C') + ']:parent (' + (this.parent.name ? this.parent.name : this.parent.collection.name) + ') [' + (this.parent instanceof Backbone.Model ? 'M' : 'C') + ']:' + args[0]);
        this.parent.trigger.apply(this.parent, args);
    }

    function documentTrigger(name) {
        Backbone.Events.trigger.apply(this, arguments);

        if (this._events) {
            var eventMatches = _.filter(_.keys(this._events), function (eventKey) {
                var match = false;

                // Do not trigger on an exact match
                if (name !== eventKey) {
                    if (name.substring(0, 6) === 'change') {
                        if (name.indexOf('.') >= 0) {
                            match = true;
                        }
                    } else {
                        match = true;
                    }
                }

                return match && eventKey.indexOf(':') >= 0 && name.indexOf(':') >= 0 && name.match(eventKey);
            });

            if (eventMatches.length) {
                var args = Array.prototype.slice.call(arguments, 0);

                _.each(eventMatches, function (event) {
                    args[0] = event;
                    Backbone.Events.trigger.apply(this, args);
                }, this);
            }
        }
    }

    function documentSave(key, val, options) {
        // ensure save is executed from the highest document model.
        var obj = this;

        while (obj.parent || (obj.collection && obj.collection.parent)) {
            obj = obj.parent || obj.collection.parent;
        }

        Backbone.Model.prototype.save.call(obj, key, val, options);
    }

    var DocumentModel = Backbone.Model.extend({
        constructor: function (models, options) {
            options || (options = {});
            _.extend(this, _.pick(options, ['idAttribute', 'parent', 'name', 'pseudoIdAttribute']));
            Backbone.Model.apply(this, arguments);

            this.on('all', function () {
                if (this.parent && this.name) {
                    documentEvents.apply(this, arguments)
                }
            }, this);
        },
        pseudoIdAttribute: false,
        toJSON: documentToJSON,
        get: documentModelGet,
        set: documentModelSet,
        save: documentSave,
        trigger: documentTrigger
    });

    var DocumentCollection = Backbone.Collection.extend({
        constructor: function (models, options) {
            options || (options = {});
            _.extend(this, _.pick(options, ['idAttribute', 'parent', 'name']));
            Backbone.Collection.apply(this, arguments);

            this.on('all', function () {
                if (this.parent && this.name) {
                    documentEvents.apply(this, arguments)
                }
            }, this);
        },
        pseudoIdAttribute: false,
        model: DocumentModel,
        idAttribute: 'id',
        toJSON: documentToJSON,
        get: documentCollectionGet,
        set: documentCollectionSet,
        trigger: documentTrigger
    });

    //Exports
    Backbone.DocumentModel = DocumentModel;
    Backbone.DocumentCollection = DocumentCollection;

    //For use in NodeJS
    if (typeof module != 'undefined') module.exports = DocumentModel;

    return Backbone;
}));
