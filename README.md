# Backbone-DocumentModel [![Build Status](https://secure.travis-ci.org/icereval/backbone-documentmodel.png?branch=master)](http://travis-ci.org/icereval/backbone-documentmodel)

A plugin to create entire Document structures with nested [Backbone.js](http://documentcloud.github.com/backbone) Models & Collections with `deep model references` and `event bubbling`.

The Document is a reference to the projects goal of allowing [MongoDB Document](http://docs.mongodb.org/manual/core/document/) JSON representation to be dynamically composed/referenced/updated and saved using native Backbone.js components.

## Usage

1. Download the latest version [here](https://github.com/icereval/backbone-documentmodel/tags), and add `backbone-documentmodel.js` to your HTML `<head>`, **after** `backbone.js` is included.

    ```html
    <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
    <script type="text/javascript" src="underscore.js"></script>
    <script type="text/javascript" src="backbone.js"></script>
    <script type="text/javascript" src="backbone-documentmodel.js"></script>
    ```

2. Change your models to extend from `Backbone.DocumentModel`, e.g.

    ```javascript
    var Person = Backbone.Model.extend({ ... });
    
    // becomes
    
    var Person = Backbone.DocumentModel.extend({ ... });
    ```

3. Change your collections to extend from `Backbone.DocumentCollection`, e.g.

    ```javascript
    var People = Backbone.Collection.extend({ ... });
    
    // becomes
    
    var People = Backbone.DocumentCollection.extend({ ... });
    ```

## Nested Attributes & Document Composition

`get()` and `set()` will work as before, you can now reference deep model names and `set()` will also dynamically compose Document data into nested Models & Collections:

### 1-1

```javascript
// dot syntax, does not create new Models/Collections, merely references them.
user.set({
  'name.first': 'John',
  'name.last': 'Doe',
  'name.middle.initial': 'Z'
});

user.get('name.first') // returns 'John'
user.get('name.middle.initial') // returns 'Z'
// -- or reference the Model directly --
user.get('name').get('first') // returns 'John'
user.get('name').get('middle').get('initial') // returns 'Z'

// object syntax, will generate entire Model/Collection nested objects,
// be careful not to overwrite existing objects with dynamic Model/Collection generation,
// use dot syntax/direct object references.
user.set({
  'name': {
    first: 'John',
    last: 'Doe',
    middle: {
      initial: 'Z'
    }
  },
});

// Dynamic composition of Backbone Model [M], Collection [C] and Attribute [A]
// user [M]
//   - name [M]
//     - first [A]
//     - last [A]
//     - middle [M]
//       - initial [A]
```

### 1-N

```javascript
// object syntax
user.set({
  'name': {
    'first': 'John',
    'last': 'Doe'
  },
  'addresses': [
    {city: 'Charlottesville', state: 'VA'},
    {city: 'Prescott', state: 'AZ'}
  ]
});
user.get('addresses.0.state') // returns 'VA'
user.get('addresses.1.city') // returns 'Prescott'

// square bracket syntax
user.set({'addresses.1.state': 'MI');

// Dynamic composition of Backbone Model [M], Collection [C] and Attribute [A]
// user [M]
//   - name [M]
//     - first [A]
//     - last [A]
//   - addressed [C]
//     - 0 [M]
//       - city [A]
//       - state [A]
//     - 1 [M]
//       - city [A]
//       - state [A]
```

## Events

### "change"

`"change"` events can be bound to nested attributes in the same way, and changing nested attributes will fire up the chain:

```javascript
// all of these will fire when 'name.middle.initial' is set or changed
user.bind('change', function(model, newVal){ ... });
user.bind('change:name', function(model, newName){ ... });
user.bind('change:name.middle', function(model, newMiddleName){ ... });
user.bind('change:name.middle.initial', function(model, newInitial){ ... });

// all of these will fire when the first address is added or changed
user.bind('change', function(model, newVal){ ... });
user.bind('change:addresses', function(model, addrs){ ... });
user.bind('change:addresses[0]', function(model, newAddr){ ... });
user.bind('change:addresses[0].city', function(model, newCity){ ... });
```

### "add" and "remove"

Additionally, nested arrays fire `"add"` and `"remove"` events:

```javascript
user.bind('add:addresses', function(model, newAddr){ ... });
user.bind('remove:addresses', function(model, oldAddr){ ... });
```

## Special Methods

### add()

Acts like `set()`, but appends the item to the nested array.  For example:

```javascript
user.get('addresses').length; //=> 2
user.add('addresses', {
  city: 'Seattle',
  state: 'WA'
});
user.get('addresses').length; //=> 3
```

### remove()

Acts like `unset()`, but if the unset item is an element in a nested array, the array will be compacted.  For example:

```javascript
user.get('addresses').length; //=> 2
user.remove('addresses[0]');
user.get('addresses').length; //=> 1
```

## Changelog

#### HEAD ([diff](https://github.com/afeld/backbone-nested/compare/v1.1.2...master?w=1))

* fix `remove()` not firing `'remove'` event when last element of array is removed (thanks @Kmandr)
* fix `clear()` and set nested attributes on `changedAttributes()` (thanks @isakb)
* `'change'` events will no longer fire if new value matches the old

#### 1.1.2 ([diff](https://github.com/afeld/backbone-nested/compare/v1.1.1...v1.1.2?w=1))

* `changedAttributes()` should include the nested attribute paths
* remove warnings when retrieving nested objects - more of a nuisance than a convenience

#### 1.1.1 ([diff](https://github.com/afeld/backbone-nested/compare/v1.1.0...v1.1.1?w=1))

* fixed `remove()` to not insert array back into itself
* upgraded test suite to Backbone 0.9.2

#### 1.1.0 ([diff](https://github.com/afeld/backbone-nested/compare/v1.0.3...v1.1.0?w=1))

* Backbone 0.9.1 compatibiity
* fire 'remove' event from remove()
* added add() method
* added [demo pages](https://github.com/afeld/backbone-nested/tree/master/demo)

#### 1.0.3 ([diff](https://github.com/afeld/backbone-nested/compare/v1.0.2...v1.0.3?w=1))

* fixed `toJSON()` ([p3drosola](https://github.com/afeld/backbone-nested/pull/9))

#### 1.0.2 ([diff](https://github.com/afeld/backbone-nested/compare/v1.0.1...v1.0.2?w=1))

* added option to silence `get()` warnings for non-leaf attributes

#### 1.0.1 ([diff](https://github.com/afeld/backbone-nested/compare/v1.0.0...v1.0.1?w=1))

* header and documentation fixes

#### 1.0.0

Initial release!

## Contributing

Pull requests are more than welcome - please add tests, which can be run by opening test/index.html.  They can also be run from the command-line (requires [PhantomJS](http://phantomjs.org/)):

    $ npm install
    $ grunt