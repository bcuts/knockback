$(document).ready(function() {
  var ContactViewModel, ContactViewModelClass;
  module("knockback_collection_observable.js");
  test("TEST DEPENDENCY MISSING", function() {
    ko.utils;
    _.VERSION;
    return Backbone.VERSION;
  });
  ContactViewModel = function(model) {
    this.name = kb.observable(model, 'name');
    this.number = kb.observable(model, 'number');
    return this;
  };
  ContactViewModelClass = (function() {
    function ContactViewModelClass(model) {
      this.name = kb.observable(model, 'name');
      this.number = kb.observable(model, 'number');
    }
    return ContactViewModelClass;
  })();
  test("Basic Usage: collection observable with ko.dependentObservable", function() {
    var collection, collection_observable, view_model;
    collection = new ContactsCollection();
    collection_observable = kb.collectionObservable(collection);
    view_model = {
      count: ko.dependentObservable(function() {
        return collection_observable().length;
      })
    };
    equal(collection.length, 0, "no models");
    equal(view_model.count(), 0, "no count");
    collection.add(new Contact({
      id: 'b1',
      name: 'Ringo',
      number: '555-555-5556'
    }));
    collection.add(new Contact({
      id: 'b2',
      name: 'George',
      number: '555-555-5555'
    }));
    equal(collection.length, 2, "2 models");
    equal(view_model.count(), 2, "2 count");
    collection.add(new Contact({
      id: 'b3',
      name: 'Paul',
      number: '555-555-5557'
    }));
    equal(collection.length, 3, "3 models");
    equal(view_model.count(), 3, "3 count");
    collection.remove('b2').remove('b3');
    equal(collection.length, 1, "1 model");
    return equal(view_model.count(), 1, "1 count");
  });
  test("Basic Usage: collection observable with ko.dependentObservable", function() {
    var collection, collection_observable, view_model;
    collection = new ContactsCollection();
    collection_observable = kb.collectionObservable(collection, {
      view_model: ContactViewModel
    });
    view_model = {
      count: ko.dependentObservable(function() {
        return collection_observable().length;
      })
    };
    equal(collection.length, 0, "no models");
    equal(view_model.count(), 0, "no count");
    collection.add(new Contact({
      id: 'b1',
      name: 'Ringo',
      number: '555-555-5556'
    }));
    collection.add(new Contact({
      id: 'b2',
      name: 'George',
      number: '555-555-5555'
    }));
    equal(collection.length, 2, "2 models");
    equal(view_model.count(), 2, "2 count");
    collection.add(new Contact({
      id: 'b3',
      name: 'Paul',
      number: '555-555-5557'
    }));
    equal(collection.length, 3, "3 models");
    equal(view_model.count(), 3, "3 count");
    collection.remove('b2').remove('b3');
    equal(collection.length, 1, "1 model");
    return equal(view_model.count(), 1, "1 count");
  });
  test("Basic Usage: no view models", function() {
    var collection, collection_observable, model, model_count, view_model;
    collection = new ContactsCollection();
    collection_observable = kb.collectionObservable(collection);
    equal(collection.length, 0, "no models");
    equal(collection_observable().length, 0, "no view models");
    collection.add(new Contact({
      id: 'b1',
      name: 'Ringo',
      number: '555-555-5555'
    }));
    collection.add(new Contact({
      id: 'b2',
      name: 'George',
      number: '555-555-5556'
    }));
    equal(collection.length, 2, "two models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection.models[1].get('name'), 'George', "George is second");
    equal(collection_observable().length, 2, "two view models");
    equal(collection_observable()[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection_observable()[1].get('name'), 'George', "George is second");
    collection.remove('b2');
    equal(collection.length, 1, "one models");
    equal(collection_observable().length, 1, "one view models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is left");
    model = kb.utils.wrappedModel(collection_observable()[0]);
    equal(model.get('name'), 'Ringo', "Ringo is left");
    model = collection_observable()[0];
    equal(model.get('name'), 'Ringo', "Ringo is left");
    view_model = collection_observable.viewModelByModel(model);
    ok(!view_model, "no view model found since the collection observable is not wrapping models in view models");
    model_count = 0;
    _.each(collection_observable(), function(model) {
      return model_count++;
    });
    equal(model_count, 1, "one model");
    return ok(collection_observable.collection() === collection, "collections match");
  });
  test("Basic Usage: no sorting and no callbacks", function() {
    var collection, collection_observable, model, view_model, view_model_count;
    collection = new ContactsCollection();
    collection_observable = kb.collectionObservable(collection, {
      view_model_create: function(model) {
        return new ContactViewModel(model);
      }
    });
    equal(collection.length, 0, "no models");
    equal(collection_observable().length, 0, "no view models");
    collection.add(new Contact({
      id: 'b1',
      name: 'Ringo',
      number: '555-555-5555'
    }));
    collection.add(new Contact({
      id: 'b2',
      name: 'George',
      number: '555-555-5556'
    }));
    equal(collection.length, 2, "two models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection.models[1].get('name'), 'George', "George is second");
    equal(collection_observable().length, 2, "two view models");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'Ringo', "Ringo is first");
    equal(kb.utils.wrappedModel(collection_observable()[1]).get('name'), 'George', "George is second");
    collection.remove('b2');
    equal(collection.length, 1, "one model");
    equal(collection_observable().length, 1, "one view model");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is left");
    model = kb.utils.wrappedModel(collection_observable()[0]);
    equal(model.get('name'), 'Ringo', "Ringo is left");
    view_model = collection_observable.viewModelByModel(model);
    equal(kb.utils.wrappedModel(view_model).get('name'), 'Ringo', "Ringo is left");
    view_model_count = 0;
    _.each(collection_observable(), function(view_model) {
      return view_model_count++;
    });
    equal(view_model_count, 1, "one view model");
    return ok(collection_observable.collection() === collection, "collections match");
  });
  test("Collection sync sorting with sort_attribute", function() {
    var collection, collection_observable, view_model_count, view_model_resort_count;
    collection = new ContactsCollection();
    view_model_count = 0;
    view_model_resort_count = 0;
    collection_observable = kb.collectionObservable(collection, {
      view_model: ContactViewModelClass,
      sort_attribute: 'name'
    });
    collection_observable.bind('add', function(view_model, collection_observable) {
      if (_.isArray(view_model)) {
        return view_model_count += view_model.length;
      } else {
        return view_model_count++;
      }
    });
    collection_observable.bind('resort', function(view_model, collection_observable, new_index) {
      if (_.isArray(view_model)) {
        return view_model_resort_count += view_model.length;
      } else {
        return view_model_resort_count++;
      }
    });
    collection_observable.bind('remove', function(view_model, collection_observable) {
      if (_.isArray(view_model)) {
        return view_model_count -= view_model.length;
      } else {
        return view_model_count--;
      }
    });
    equal(collection.length, 0, "no models");
    equal(view_model_count, 0, "no view models");
    equal(collection_observable().length, 0, "no view models");
    collection.add(new Contact({
      id: 'b1',
      name: 'Ringo',
      number: '555-555-5556'
    }));
    collection.add(new Contact({
      id: 'b2',
      name: 'George',
      number: '555-555-5555'
    }));
    equal(collection.length, 2, "two models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection.models[1].get('name'), 'George', "George is second");
    equal(view_model_count, 2, "two view models");
    equal(collection_observable().length, 2, "two view models");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'George', "George is first - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[1]).get('name'), 'Ringo', "Ringo is second - sorting worked!");
    collection.add(new Contact({
      id: 'b3',
      name: 'Paul',
      number: '555-555-5557'
    }));
    equal(collection.length, 3, "three models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection.models[1].get('name'), 'George', "George is second");
    equal(collection.models[2].get('name'), 'Paul', "Paul is second");
    equal(view_model_count, 3, "three view models");
    equal(collection_observable().length, 3, "two view models");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'George', "George is first - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[1]).get('name'), 'Paul', "Paul is second - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[2]).get('name'), 'Ringo', "Ringo is third - sorting worked!");
    collection.remove('b2').remove('b3');
    equal(collection.length, 1, "one model");
    equal(view_model_count, 1, "one view model");
    equal(collection_observable().length, 1, "one view model");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is left");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'Ringo', "Ringo is left");
    collection.reset();
    equal(collection.length, 0, "no models");
    equal(view_model_count, 0, "no view models");
    equal(collection_observable().length, 0, "no view models");
    return ok(view_model_resort_count === 0, "not resorting happened because everything was inserted once");
  });
  test("Collection sync sorting with sorted_index", function() {
    var SortWrapper, collection, collection_observable, view_model_count, view_model_resort_count;
    view_model_count = 0;
    view_model_resort_count = 0;
    SortWrapper = (function() {
      function SortWrapper(value) {
        this.parts = value.split('-');
      }
      SortWrapper.prototype.compare = function(that) {
        var diff, index, part, _ref;
        if (this.parts.length !== that.parts.length) {
          return that.parts.length - this.parts.length;
        }
        _ref = this.parts;
        for (index in _ref) {
          part = _ref[index];
          diff = that.parts[index] - Math.parseInt(part, 10);
          if (diff !== 0) {
            return diff;
          }
        }
        return 0;
      };
      return SortWrapper;
    })();
    collection = new ContactsCollection();
    collection_observable = kb.collectionObservable(collection, {
      sorted_index: kb.siwa('number', SortWrapper)
    });
    collection.add(new Contact({
      id: 'b1',
      name: 'Ringo',
      number: '555-555-5556'
    }));
    collection.add(new Contact({
      id: 'b2',
      name: 'George',
      number: '555-555-5555'
    }));
    equal(collection.length, 2, "two models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection.models[1].get('name'), 'George', "George is second");
    equal(collection_observable().length, 2, "two view models");
    equal(collection_observable()[0].get('name'), 'George', "George is first - sorting worked!");
    equal(collection_observable()[1].get('name'), 'Ringo', "Ringo is second - sorting worked!");
    collection = new ContactsCollection();
    collection_observable = kb.collectionObservable(collection, {
      view_model: ContactViewModelClass,
      sorted_index: kb.siwa('number', SortWrapper)
    });
    collection.add(new Contact({
      id: 'b1',
      name: 'Ringo',
      number: '555-555-5556'
    }));
    collection.add(new Contact({
      id: 'b2',
      name: 'George',
      number: '555-555-5555'
    }));
    equal(collection.length, 2, "two models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection.models[1].get('name'), 'George', "George is second");
    equal(collection_observable().length, 2, "two view models");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'George', "George is first - sorting worked!");
    return equal(kb.utils.wrappedModel(collection_observable()[1]).get('name'), 'Ringo', "Ringo is second - sorting worked!");
  });
  test("Collection sorting with callbacks", function() {
    var collection, collection_observable, view_model_count, view_model_resort_count;
    collection = new NameSortedContactsCollection();
    view_model_count = 0;
    view_model_resort_count = 0;
    collection_observable = kb.collectionObservable(collection, {
      view_model: ContactViewModel
    });
    collection_observable.bind('add', function(view_model, collection_observable) {
      if (_.isArray(view_model)) {
        return view_model_count += view_model.length;
      } else {
        return view_model_count++;
      }
    });
    collection_observable.bind('resort', function(view_model, collection_observable, new_index) {
      if (_.isArray(view_model)) {
        return view_model_resort_count += view_model.length;
      } else {
        return view_model_resort_count++;
      }
    });
    collection_observable.bind('remove', function(view_model, collection_observable) {
      if (_.isArray(view_model)) {
        return view_model_count -= view_model.length;
      } else {
        return view_model_count--;
      }
    });
    equal(collection.length, 0, "no models");
    equal(collection_observable().length, 0, "no view models");
    collection.add(new Contact({
      id: 'b1',
      name: 'Ringo',
      number: '555-555-5556'
    }));
    collection.add(new Contact({
      id: 'b2',
      name: 'George',
      number: '555-555-5555'
    }));
    equal(collection.length, 2, "two models");
    equal(collection.models[0].get('name'), 'George', "George is first");
    equal(collection.models[1].get('name'), 'Ringo', "Ringo is second");
    equal(view_model_count, 2, "two view models");
    equal(collection_observable().length, 2, "two view models");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'George', "George is first - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[1]).get('name'), 'Ringo', "Ringo is second - sorting worked!");
    collection.add(new Contact({
      id: 'b3',
      name: 'Paul',
      number: '555-555-5557'
    }));
    equal(collection.length, 3, "three models");
    equal(collection.models[0].get('name'), 'George', "George is first");
    equal(collection.models[1].get('name'), 'Paul', "Paul is second");
    equal(collection.models[2].get('name'), 'Ringo', "Ringo is second");
    equal(view_model_count, 3, "three view models");
    equal(collection_observable().length, 3, "two view models");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'George', "George is first - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[1]).get('name'), 'Paul', "Paul is second - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[2]).get('name'), 'Ringo', "Ringo is third - sorting worked!");
    collection.remove('b2').remove('b3');
    equal(collection.length, 1, "one models");
    equal(view_model_count, 1, "one view models");
    equal(collection_observable().length, 1, "one view models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is left");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'Ringo', "Ringo is left");
    collection.reset();
    equal(collection.length, 0, "no models");
    equal(view_model_count, 0, "no view models");
    equal(collection_observable().length, 0, "no view models");
    return ok(view_model_resort_count === 0, "not resorting happened because everything was inserted once");
  });
  test("Collection sync dynamically changing the sorting function", function() {
    var collection, collection_observable;
    collection = new ContactsCollection();
    collection_observable = kb.collectionObservable(collection, {
      view_model: ContactViewModel
    });
    equal(collection.length, 0, "no models");
    equal(collection_observable().length, 0, "no view models");
    collection.add(new Contact({
      id: 'b1',
      name: 'Ringo',
      number: '555-555-5556'
    }));
    collection.add(new Contact({
      id: 'b2',
      name: 'George',
      number: '555-555-5555'
    }));
    equal(collection.length, 2, "two models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection.models[1].get('name'), 'George', "George is second");
    equal(collection_observable().length, 2, "two view models");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'Ringo', "Ringo is first - no sorting");
    equal(kb.utils.wrappedModel(collection_observable()[1]).get('name'), 'George', "George is first - no sorting");
    collection_observable.sortedIndex((function(view_models, vm) {
      return _.sortedIndex(view_models, vm, function(test) {
        return kb.utils.wrappedModel(test).get('name');
      });
    }), 'name');
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection.models[1].get('name'), 'George', "George is second");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'George', "George is first - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[1]).get('name'), 'Ringo', "Ringo is second - sorting worked!");
    collection.add(new Contact({
      id: 'b3',
      name: 'Paul',
      number: '555-555-5554'
    }));
    equal(collection.length, 3, "three models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection.models[1].get('name'), 'George', "George is second");
    equal(collection.models[2].get('name'), 'Paul', "Paul is second");
    equal(collection_observable().length, 3, "two view models");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'George', "George is first - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[1]).get('name'), 'Paul', "Paul is second - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[2]).get('name'), 'Ringo', "Ringo is third - sorting worked!");
    collection_observable.sortAttribute('number');
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is first");
    equal(collection.models[1].get('name'), 'George', "George is second");
    equal(collection.models[2].get('name'), 'Paul', "Paul is second");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'Paul', "Paul is first - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[1]).get('name'), 'George', "Paul is second - sorting worked!");
    equal(kb.utils.wrappedModel(collection_observable()[2]).get('name'), 'Ringo', "Ringo is third - sorting worked!");
    collection_observable.sortAttribute('name');
    collection.remove('b2').remove('b3');
    equal(collection.length, 1, "one models");
    equal(collection_observable().length, 1, "one view models");
    equal(collection.models[0].get('name'), 'Ringo', "Ringo is left");
    equal(kb.utils.wrappedModel(collection_observable()[0]).get('name'), 'Ringo', "Ringo is left");
    collection.reset();
    equal(collection.length, 0, "no models");
    return equal(collection_observable().length, 0, "no view models");
  });
  return test("Error cases", function() {
    raises((function() {
      return kb.collectionObservable();
    }), Error, "CollectionObservable: collection is missing");
    kb.collectionObservable(new ContactsCollection(), ko.observableArray([]));
    kb.vmModel(new Contact());
    kb.collectionObservable(new ContactsCollection());
    return kb.collectionObservable(new ContactsCollection(), {});
  });
});