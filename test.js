_ = require('underscore');
Backbone = require('backbone');
require('./backbone-documentmodel.js');

function ok(a) {
    console.log('ok:' + a);
}

function equal(a, b) {
    console.log('equal:' + (a === b) + ' | a:' + a + ' - b:' + b);
}

var orderModel = new Backbone.DocumentModel();

var personModel = new Backbone.DocumentModel({
    firstName: 'John',
    lastLast: 'Doe'
});

var shippingModel = new Backbone.DocumentModel({
    street: '1234 Lala Ln.',
    city: 'Charlottesville',
    state: 'VA',
    id: 42
});

orderModel.set('person', personModel);
equal(orderModel.get('person.firstName'), 'John');
equal(orderModel.get('person.lastLast'), 'Doe');
equal(orderModel.get('shipping.street'), undefined);
equal(orderModel.get('shipping.city'), undefined);
equal(orderModel.get('shipping.state'), undefined);

var personModel = new Backbone.DocumentModel({
    firstName: 'Nicholas',
    lastLast: 'Cage',
    id: 69
});

orderModel.set('whoisthebest', personModel);
equal(orderModel.get('whoisthebest.firstName'), 'Nicholas');
equal(orderModel.get('whoisthebest.lastLast'), 'Cage');
equal(orderModel.get('whoisthebest.id'), 69);

orderModel.set('shipping', shippingModel);
equal(orderModel.get('person.firstName'), 'John');
equal(orderModel.get('person.lastLast'), 'Doe');
equal(orderModel.get('shipping.street'), '1234 Lala Ln.');
equal(orderModel.get('shipping.city'), 'Charlottesville');
equal(orderModel.get('shipping.state'), 'VA');

// verify event bubbling occurs on the original document-model.
shippingModel.on('change', function () {
    ok(1);
});

shippingModel.on('change:*', function () {
    ok(1);
});

shippingModel.on('change:street', function () {
    ok(1);
});

// verify event bubbling occurs on added document-model child.
orderModel.on('change', function () {
    ok(1); // should not fire, as `change` only fires on collection parent.
});

orderModel.get('shipping').on('change', function () {
    ok(1);
});

orderModel.on('change:*', function () {
    ok(1);
});

orderModel.on('change:shipping.*', function () {
    ok(1);
});

orderModel.on('change:shipping.street', function () {
    ok(1);
});

orderModel.set('shipping.street', '4321 Somewhere St.');
equal(orderModel.get('shipping.street'), '4321 Somewhere St.');

doc = new Backbone.DocumentModel({
    id     : '1-the-tempest',
    title  : "The Tempest",
    author : "Bill Shakespeare",
    length : 123
});
collection = new Backbone.DocumentCollection();;

collection.add(doc);
var Model = Backbone.DocumentModel.extend({
    initialize: function() {
        this.one = 1;
        equal(this.collection, collection);
    }
});
var model = new Model({}, {collection: collection});
equal(model.one, 1);
equal(model.collection, collection);