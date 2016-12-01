var QUnit = require('steal-qunit');
var DefineMap = require('can-define/map/');
var DefineList = require('can-define/list/');
// Behaviors
var serviceBehavior = require('./service');
var connect = require('can-connect');
var dataParse = require('can-connect/data/parse/');
var construct = require('can-connect/constructor/');
var constructStore = require('can-connect/constructor/store/');
var constructOnce = require('can-connect/constructor/callbacks-once/');
var canMap = require('can-connect/can/map/');
var canRef = require('can-connect/can/ref/');
var dataCallbacks = require('can-connect/data/callbacks/');
var realtime = require('can-connect/real-time/');

var feathers = require('feathers/client');
var hooks = require('feathers-hooks');
var auth = require('feathers-authentication/client');

module.exports = function runProviderTests (options) {
  QUnit.module(`Basics: ${options.moduleName}`, {
    beforeEach () {
      window.localStorage.clear();
    }
  }, function () {
    var app = feathers()
      .configure(options.provider)
      .configure(hooks())
      .configure(auth());

    var Message = DefineMap.extend({
      _id: '*',
      text: 'string'
    });

    Message.List = DefineList.extend({
      '*': Message
    });

    var behaviors = [
      serviceBehavior,
      dataParse,
      canMap,
      canRef,
      realtime,
      construct,
      constructStore,
      constructOnce,
      dataCallbacks
    ];

    var feathersService = app.service('messages');

    connect(behaviors, {
      feathersService, // Connect the instance to your model.
      idProp: '_id',
      Map: Message,
      List: Message.List,
      name: 'message'
    });

    QUnit.test('findAll', function (assert) {
      var done = assert.async();

      Message.findAll({}).then(messages => {
        assert.ok(messages, 'Got a response from findAll');
        assert.equal(messages instanceof Message.List, true, 'got a Message.List back');
        done();
      });
    });

    QUnit.test('findOne', function (assert) {
      var done = assert.async();

      var message = new Message({
        text: 'Hi there!'
      });
      message.save().then(function (msg) {
        var id = msg._id;
        // Make sure the message was deleted.
        Message.findOne(id).then(function (findResponse) {
          assert.deepEqual(msg, findResponse, 'got same instance in find');
          done();
        });
      });
    });

    QUnit.test('findOne with params', function (assert) {
      var done = assert.async();

      var message = new Message({
        text: 'Hi there!'
      });
      message.save().then(function (msg) {
        var id = msg._id;
        Message.findOne({_id: id}).then(function (findResponse) {
          assert.deepEqual(msg, findResponse, 'got same instance in find passing params');
          done();
        });
      });
    });

    QUnit.test('create', function (assert) {
      var done = assert.async();
      var message = new Message({
        text: 'Hi there!'
      });
      message.save().then(function (msg) {
        assert.ok(msg);
        done();
      });
    });

    QUnit.test('update', function (assert) {
      var done = assert.async();

      var message = new Message({
        text: 'Hi there!'
      });
      message.save().then(function (msg) {
        msg.text = 'Hello!';
        window.localStorage.clear();
        // Make sure the message was deleted.
        msg.save().then(function (saveResponse) {
          assert.equal(saveResponse.text, 'Hello!', 'message text updated correctly');
          done();
        });
      });
    });

    QUnit.test('delete', function (assert) {
      var done = assert.async();

      var message = new Message({
        text: 'Hi there!'
      });
      message.save().then(function (msg) {
        var id = msg._id;
        msg.destroy().then(function (res) {
          assert.equal(res._id, id, 'deleted the instance');
          // Make sure the message was deleted.
          Message.findOne(id).catch(function (err) {
            assert.ok(err, 'no record was found');
            done();
          });
        });
      });
    });
  });
};