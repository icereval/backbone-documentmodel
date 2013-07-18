# Backbone-DocumentModel [![Build Status](https://secure.travis-ci.org/icereval/backbone-documentmodel.png?branch=master)](http://travis-ci.org/icereval/backbone-documentmodel)

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
            this.collection.push({
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
    },
    onEditAddress: function () {
        var addressModalView = new AddressModalView({ model: this.model.get('addresses').at(0) });

        addressModalView.render();
    },
    onRemoveAddress: function () {
        this.model.get('addresses').remove(0);
    }
});
```

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
  name: {
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
    name: {
        first: 'John',
        last: 'Doe'
    },
    addresses: [
      { city: 'Charlottesville', state: 'VA' },
      { city: 'Prescott', state: 'AZ' }
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
//   - addresses [C]
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
// events fired 'name.middle.initial' is set or changed
user.get('name').get('middle').on('change:initial', function () { ... });
user.get('name').on('change:middle.initial', function () { ... });
user.on('change:name.middle.initial', function () { ... });

// all of these will fire when the first address is added or changed
user.on('change', function () { ... });
user.on('change:addresses.*', function () { ... });
user.on('change:addresses.city', function () { ... });
```

### "add" and "remove"

Additionally, nested arrays fire `"add"` and `"remove"` events:

```javascript
// add/remove with wildcard (technically all names are regex evaluations)
user.on('add:*', function () { ... });
user.on('remove:*', function () { ... });
```

## Changelog

#### 1.0.0

Initial release!

## Contributing

Pull requests are more than welcome - please add tests, which can be run by opening test/index.html.  They can also be run from the command-line (requires [PhantomJS](http://phantomjs.org/)):

    $ npm install
    $ grunt