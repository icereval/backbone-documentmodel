# Backbone-DocumentModel [![Build Status](https://secure.travis-ci.org/icereval/backbone-documentmodel.png?branch=master)](https://travis-ci.org/icereval/backbone-documentmodel)
A plugin to create entire Document structures with nested [Backbone.js](http://documentcloud.github.com/backbone) Models & Collections with `deep model` references and `event bubbling`.

The Document is simply a reference to the project's goal of allowing [MongoDB Document](http://docs.mongodb.org/manual/core/document/) JSON representation to be dynamically composed/referenced/updated and saved using native Backbone.js components.

## Another Backbone.js plugin...

After working with document objects we kept running into a situation where we wanted to pass Model/Collection objects to our nested Backbone.Views, however this proved troublesome to keep track of changes made within those Views.

```javascript
// Setup our Document Model object.
user.set({
    name: {
        first: 'John',
        last: 'Doe'
    },
    addresses: [
        { type: 'Shipping', city: 'Charlottesville', state: 'VA' },
        { type: 'Billing', city: 'Prescott', state: 'AZ' }
    ]
});
```

When making a new Backbone.View its common to pass in a Model or Collection, and it would be best practice to pass only the specific Model/Collection that the control needed.

```javascript
var AddressModalView = Backbone.View.extend({
    events: {
        'click .save': 'onSave'
    },
    render: function () {
        // code to render the template and output el for the dom.
    },
    onSave: function () {
        if (this.model) {
            this.model.set('type', this.$el.find('.type').val());
            this.model.set('city', this.$el.find('.city').val());
            this.model.set('state', this.$el.find('.state').val());
        } else {
            this.collection.add({
                type: this.$el.find('.type').val(),
                city: this.$el.find('.city').val(),
                state: this.$el.find('.state').val()
            });
        }
    }
});

var UserView = Backbone.View.extend({
    initialize: function () {
        this.model.on('add:addresses', function () {
            alert('address added!'); // or save...
        }, this);

        this.model.on('remove:addresses', function () {
            alert('address removed!'); // or save...
        }, this);

        this.model.on('change:addresses.*', function () {
            alert('address changed!'); // or save...
        }, this);
    },
    onAddAddress: function () {
        var addressModalView = new AddressModalView({ collection: this.model.get('addresses') });

        addressModalView.render();
        addressModalView.show(); // attach to el
    },
    onEditAddress: function () {
        var addressModalView = new AddressModalView({ model: this.model.get('addresses').at(0) });

        addressModalView.render();
        addressModalView.show(); // attach to el
    },
    onRemoveAddress: function () {
        this.model.get('addresses').remove(this.model.get('addresses.0'));
    }
});
```

## Usage

1. Download the latest version [here](https://github.com/icereval/backbone-documentmodel), and add `backbone-documentmodel.js` to your HTML `<head>`, **after** `backbone.js` is included.

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

set()

```javascript
// object syntax - will generate entire Model/Collection nested objects.
// NOTE: be careful not to overwrite existing Collections as a set Array
//       will overwrite an existing Collection.
user.set({
    name: {
        first: 'John',
        last: 'Doe',
        middle: {
            initial: 'Z'
        }
    }
});

user.get('name').get('middle').set('initial', 'Z');

// dot syntax - will create new Models and properties (not Collections).
// NOTE: dynamic Collection composition is not supported on array indicies,
//       however you can update an existing array item.
//       ex: 'addresses.0.city': 'Charlottesville'
user.set({
    'name.first': 'John',
    'name.last': 'Doe',
    'name.middle.initial': 'Z'
});

user.get('name').set({ 'middle.initial': 'Z' });

// dynamic composition of Backbone Model [M], Collection [C] and Attribute [A]
// user [M]
//   - name [M]
//     - first [A]
//     - last [A]
//     - middle [M]
//       - initial [A]
```

get()

```javascript
// dot syntax
user.get('name.first'); // returns 'John'
user.get('name.middle.initial'); // returns 'Z'
user.get('name').get('middle.initial'); // returns 'Z'

// direct
user.get('name').get('first'); // returns 'John'
user.get('name').get('middle').get('initial'); // returns 'Z'
```

### 1-N

set()

```javascript
// object syntax - will generate entire Model/Collection nested objects.
// NOTE: be careful not to overwrite existing Collections as a set Array
//       will overwrite an existing Collection.
user.set({
    addresses: [
        { city: 'Charlottesville', state: 'VA' },
        { city: 'Prescott', state: 'AZ' }
    ]
});

user.get('addresses').at(0).set('state', 'VA');
user.get('addresses').at(1).set({ state: 'AZ', city: 'Prescott' });

// dot syntax - will update existing Collection items, non-existing items are ignored.
// NOTE: dynamic Collection composition is not supported on array indicies,
//       however you can update an existing array item.
//       ex: 'addresses.0.city': 'Charlottesville'
user.set('addresses.0.state': 'VA');
user.set({ 'addresses.1.state': 'AZ', 'addresses.1.city': 'Prescott' });

// dynamic composition of Backbone Model [M], Collection [C] and Attribute [A]
// user [M]
//   - addresses [C]
//     - 0 [M]
//       - city [A]
//       - state [A]
//     - 1 [M]
//       - city [A]
//       - state [A]
```

get()

```javascript
// dot syntax
user.get('addresses.0.state') // returns 'VA'
user.get('addresses.1.city') // returns 'Prescott'

// direct
user.get('addresses').at(0).get('state') // returns 'VA'
user.get('addresses').at(1).get('city') // returns 'Prescott'
```

## JSON

`toJSON` will decompose the Document Model/Collection into a JSON object, ready for transport.

```javascript
serverInput = {
    name: {
        first: 'John',
        last: 'Doe',
        middle: {
            initial: 'Z'
        }
    },
    addresses: [
        { city: 'Charlottesville', state: 'VA' },
        { city: 'Prescott', state: 'AZ' }
    ],
    items: [123, 456]
};

user.set(serverInput);

// dynamic composition of Backbone Model [M], Collection [C] and Attribute [A]
// user [M]
//   - name [M]
//     - first [A]
//     - last [A]
//     - middle [M]
//       - initial [A]
//   - addresses [C]
//     - 0 [M]
//       - city [A]
//       - state [A]
//     - 1 [M]
//       - city [A]
//       - state [A]
//   - items [C]
//     - 0 [M]
//       - value [A]
//     - 1 [M]
//       - value [A]

// Calling `toJSON` will retrieve the composed document JSON representation.
modelJSON = user.toJSON();

modelJSON = {
    name: {
        first: 'John',
        last: 'Doe',
        middle: {
            initial: 'Z'
        }
    },
    addresses: [
        { city: 'Charlottesville', state: 'VA' },
        { city: 'Prescott', state: 'AZ' }
    ],
    items: [123, 456]
};
```

## Events

### "change"

`"change"` events can be bound to nested attributes in the same way, and changing nested attributes will fire up the chain:

```javascript
// events fired 'name.middle.initial' is set or changed
user.get('name').get('middle').on('change:initial', function () { ... });
user.get('name').on('change:middle.initial', function () { ... });
user.on('change:name.middle.initial', function () { ... });

// all of these will fire when any address is added or changed
user.on('change:addresses.city', function () { ... });
user.on('change:addresses.*', function () { ... });
user.on('change:*', function () { ... });
```

### "add" and "remove"

Additionally, nested arrays fire `"add"` and `"remove"` events:

```javascript
// add/remove (all names are regex evaluations)
user.on('add:addresses', function () { ... });
user.on('add:*', function () { ... });

user.on('remove:addresses', function () { ... });
user.on('remove:*', function () { ... });
```

## Custom Models and Collections for nested values

If you need further control over what kind of Model & Collection objects get created for nested values, you can override
the `getNestedModel` and / or `getNestedCollection` method of `Backbone.DocumentModel` subclasses. Both methods have the
same signature:

```javascript
// For nested models
getNestedModel(nestedKey, nestedValue, nestedOptions)

// For nested collections
getNestedCollection(nestedKey, nestedValue, nestedOptions)
```

The parameters:
* `nestedKey` *string*: The name of the nested property.
* `nestedValue` *object*: The value of `this` at `nestedKey`.
* `nestedOptions` *object*: The constructor options for the resulting Model or Collection.

You should always return an instance of `Backbone.DocumentModel` or `Backbone.DocumentCollection` respectively.
You should avoid modifications on any of the passed objects.

```javascript
user = {
    name: {
        first: 'John',
        last: 'Doe',
        middle: {
            initial: 'Z'
        }
    },
    addresses: [
        { type: 'Shipping', city: 'Charlottesville', state: 'VA' },
        { type: 'Billing', city: 'Prescott', state: 'AZ' }
    ],
    items: [123, 456]
};

// The model for the 'name' object
Name = Backbone.DocumentModel.extend({
    getFullName: function () {
        return this.get('first').concat(' ', this.get('middle').get('initial'), ' ', this.get('last'));
    }
});

// The model for items of 'adresses'
Address = Backbone.DocumentModel.extend({
    getFullAddress: function () {
        return this.get('city').concat(', ', this.get('state'));
    }
});

// The 'adresses' collection
Addresses = Backbone.DocumentCollection({
    model: Address
});

// The 'user' object
User = Backbone.DocumentModel.extend({

    // For models
    getNestedModel: function (nestedKey, nestedValue, nestedOptions) {
        switch (nestedKey) {
            case 'name':
                return new Name(nestedKey, nestedValue, nestedOptions);
            default:
                return new Backbone.DocumentModel(nestedValue, nestedOptions);
        }
    },

    // For collections
    getNestedCollection: function (nestedKey, nestedValue, nestedOptions) {
        switch (nestedKey) {
            case 'addresses':
                return new Addresses(nestedValue, nestedOptions);
            default:
                return new Backbone.DocumentCollection(nestedValue, nestedOptions);
        }
    }
});

john = new User(user);

john.get('name').getFullName();
// John Z Doe

john.get('addresses.0').getFullAddress();
// Charlottesville, VA
```

If you want to create different Model objects for items in a DocumentCollection, refer to the
[Backbone.js docs](http://backbonejs.org/#Collection-model). It's actually a core feature.


## Changelog

#### 0.6.4

- Fixes issue #7 nested array's toJSON() now returns the value.

#### 0.6.3

- Fixes issue #6 fully reference Object.prototype.toString since certain browser's do not resolve method.

#### 0.6.2

- Fixes issue #5 address wrapped primitives.

#### 0.6.1

- Fixes issue #4 properly handles nested arrays.

#### 0.6.0

- Added minimally altered backbone model/collection unit tests.
- Added readme.md specific tests.
- Updated backbone-documentmodel.js to pass unit tests.

#### 0.5.x

- Initial release!
