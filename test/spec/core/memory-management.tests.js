const r = typeof require !== 'undefined';
const root = (typeof window !== 'undefined') ? window : (typeof global !== 'undefined') ? global : this;
let assert = root.assert; try { assert = assert || (r ? require('chai').assert : undefined); } catch (e) { /**/ }

let kb = root.kb; try { kb = kb || (r ? require('knockback') : undefined); } catch (e) { kb = kb || (r ? require('../../../knockback') : undefined); }
const { _, Backbone, ko } = kb;
const { $ } = root;

describe('knockback.js memory management', () => {
  it('TEST DEPENDENCY MISSING', () => {
    assert.ok(!!ko, 'ko');
    assert.ok(!!_, '_');
    assert.ok(!!Backbone.Model, 'Backbone.Model');
    assert.ok(!!Backbone.Collection, 'Backbone.Collection');
    assert.ok(!!kb, 'kb');
  });

  // ref counted view model
  class RefCountableViewModel {
    static initClass() {
      this.view_models = [];
    }
    constructor() {
      RefCountableViewModel.view_models.push(this);
      this.ref_count = 1;
    }

    refCount() { return this.ref_count; }
    retain() {
      this.ref_count++;
      return this;
    }
    release() {
      --this.ref_count;
      if (this.ref_count < 0) { throw new Error('ref count is corrupt'); }
      if (!this.ref_count) {
        this.is_destroyed = true;
        this.__destroy();
      }
      return this;
    }

    __destroy() {
      return RefCountableViewModel.view_models.splice(_.indexOf(RefCountableViewModel.view_models, this), 1);
    }
  }
  RefCountableViewModel.initClass();

  // destroyable view model
  class DestroyableViewModel {
    static initClass() {
      this.view_models = [];
    }
    constructor() {
      DestroyableViewModel.view_models.push(this);
    }

    destroy() {
      return DestroyableViewModel.view_models.splice(_.indexOf(DestroyableViewModel.view_models, this), 1);
    }
  }
  DestroyableViewModel.initClass();

  // simple view model
  class SimpleViewModel {
    static initClass() {
      this.view_models = [];
    }
    constructor() {
      this.prop = ko.observable();
      SimpleViewModel.view_models.push(this);
    }
  }
  SimpleViewModel.initClass();

  it('Basic view model properties', () => {
    kb.statistics = new kb.Statistics(); // turn on stats

    const nested_view_model = kb.viewModel(new Backbone.Model({ name: 'name1' }), { name: {} });
    const ViewModel = function () {
      this.prop1 = ko.observable();
      this.prop2 = ko.observable(['test', 1, null, kb.viewModel(new Backbone.Model({ name: 'name1' }))]);
      this.prop3 = ko.observableArray(['test', 1, null, kb.viewModel(new Backbone.Model({ name: 'name1' }))]);
      this.prop4 = ko.computed(() => true);
      this.prop5 = kb.observable(new Backbone.Model({ name: 'name1' }), 'name');
      this.prop6 = nested_view_model;
      this.prop7 = kb.collectionObservable(new Backbone.Collection(), { models_only: true });
      this.prop8 = kb.viewModel(new Backbone.Model({ name: 'name1' }));
      this.prop9 = kb.collectionObservable(new Backbone.Collection());
    };
    const view_model = new ViewModel();
    kb.release(view_model);

    for (let index = 1; index <= 9; index++) { assert.ok(!view_model[`prop${index}`], `Property released: prop${index}`); }
    assert.ok(!view_model.name, 'Property released: view_model.name'); // kb.viewModel(new Backbone.Model({name: 'name1'}), 'name', this)
    assert.ok(!nested_view_model.name, 'Property released: nested_view_model.name'); // nested_view_model

    assert.equal(kb.statistics.registeredStatsString('all released'), 'all released', 'Cleanup: stats'); kb.statistics = null;
  });

  it('Releasing with nodes', () => {
    if (!$) return;

    kb.statistics = new kb.Statistics(); // turn on stats

    const model = new Backbone.Model({ name: 'Bob' });
    const view_model = kb.viewModel(model);
    const collection_observable = kb.collectionObservable(new Backbone.Collection([new Backbone.Model({ name: 'Fred' }), new Backbone.Model({ name: 'Mary' })]));

    const $vm_el = $('<div id="vm" data-bind="text: name"></div>');
    const $co_el = $('<div id="co" data-bind="foreach: co"><div data-bind="text: name"></div></div>');
    $('body').append($vm_el).append($co_el);

    kb.applyBindings(view_model, $vm_el[0]);
    kb.applyBindings({ co: collection_observable }, $co_el[0]);

    assert.equal($vm_el.text(), 'Bob', 'found Bob');
    const iterable = $co_el.children();
    for (let index = 0; index < iterable.length; index++) {
      const child = iterable[index];
      const name = index ? 'Mary' : 'Fred';
      assert.equal($(child).text(), name, `found ${name}`);
    }

    assert.equal(kb.statistics.registeredCount('ViewModel'), 3, '3 bound view models');
    assert.equal(kb.statistics.registeredCount('CollectionObservable'), 1, '1 bound collection observable');

    // dispose of the collection node
    ko.removeNode($co_el[0]);
    assert.equal(kb.statistics.registeredCount('ViewModel'), 1, '1 bound view model');
    assert.equal(kb.statistics.registeredCount('CollectionObservable'), 0, 'no bound collection observables');

    // dispose of the model node
    ko.removeNode($vm_el[0]);

    assert.ok(kb.Statistics.eventsStats(model).count === 0, `All model events cleared. Expected: 0. Actual: ${JSON.stringify(kb.Statistics.eventsStats(model))}`);
    assert.equal(kb.statistics.registeredStatsString('all released'), 'all released', 'Cleanup: stats'); kb.statistics = null;
  });

  it('RefCounting', () => {
    kb.statistics = new kb.Statistics(); // turn on stats

    class RefViewModel {
      constructor() {
        this.prop = kb.observable(new Backbone.Model({ name: 'name1' }), 'name');
        // reference counting
        this.ref_count = 1;
      }

      refCount() { return this.ref_count; }
      retain() {
        this.ref_count++;
        return this;
      }
      release() {
        --this.ref_count;
        if (this.ref_count < 0) { throw new Error('ref count is corrupt'); }
        if (!this.ref_count) {
          this.is_destroyed = true;
          this.__destroy();
        }
        return this;
      }

      __destroy() {
        kb.release(this.prop); this.prop = null;
      }
    }

    const ref_counted = new RefViewModel();
    const view_model =
      { ref_counted: ref_counted.retain() };
    kb.release(view_model);
    assert.ok(!view_model.ref_counted, 'Property released: view_model.ref_counted');
    assert.ok(!!ref_counted.prop, 'Property not released: ref_counted.prop');

    ref_counted.release();
    assert.ok(!ref_counted.prop, 'Property released: ref_counted.prop');

    assert.equal(kb.statistics.registeredStatsString('all released'), 'all released', 'Cleanup: stats'); kb.statistics = null;
  });

  it('kb.CollectionObservable', () => {
    kb.statistics = new kb.Statistics(); // turn on stats

    // ref counted view model
    RefCountableViewModel.view_models = [];
    let collection_observable = kb.collectionObservable(new Backbone.Collection([{ name: 'name1' }, { name: 'name2' }]), { view_model: RefCountableViewModel });
    assert.equal(RefCountableViewModel.view_models.length, 2, 'Created: 2');

    const instance = collection_observable()[0].retain();

    kb.release(collection_observable);
    assert.equal(RefCountableViewModel.view_models.length, 1, 'Still one reference');
    assert.equal(instance.refCount(), 1, "All instances were destroyed in the collection's store");

    // destroyable view model
    DestroyableViewModel.view_models = [];
    collection_observable = kb.collectionObservable(new Backbone.Collection([{ name: 'name1' }, { name: 'name2' }]), { view_model: DestroyableViewModel });
    assert.equal(DestroyableViewModel.view_models.length, 2, 'Created: 2');

    kb.release(collection_observable);
    assert.equal(DestroyableViewModel.view_models.length, 0, 'All destroyed');

    // simple view model
    SimpleViewModel.view_models = [];
    collection_observable = kb.collectionObservable(new Backbone.Collection([{ name: 'name1' }, { name: 'name2' }]), { view_model: SimpleViewModel });
    assert.equal(SimpleViewModel.view_models.length, 2, 'Created: 2');

    kb.release(collection_observable);
    assert.equal(SimpleViewModel.view_models.length, 2, 'Destroyed: 2');
    _.each(SimpleViewModel.view_models, (view_model) => { assert.ok(!view_model.prop, 'Prop destroyed'); });

    assert.equal(kb.statistics.registeredStatsString('all released'), 'all released', 'Cleanup: stats'); kb.statistics = null;
  });

  it('kb.CollectionObservable with external store', () => {
    kb.statistics = new kb.Statistics(); // turn on stats

    // ref counted view model
    let store = new kb.Store();
    RefCountableViewModel.view_models = [];
    let collection_observable = kb.collectionObservable(new Backbone.Collection([{ name: 'name1' }, { name: 'name2' }]), { view_model: RefCountableViewModel, store });
    assert.equal(RefCountableViewModel.view_models.length, 2, 'Created: 2');

    const instance = collection_observable()[0].retain();

    kb.release(collection_observable);
    assert.equal(RefCountableViewModel.view_models.length, 2, 'Remaining: 2');

    assert.equal(instance.refCount(), 2, 'One instance retained and one in the store');

    store.destroy(); store = null;

    assert.equal(RefCountableViewModel.view_models.length, 1, 'Still one reference');
    assert.equal(instance.refCount(), 1, "All instances were destroyed in the collection's store");

    // destroyable view model
    store = new kb.Store();
    DestroyableViewModel.view_models = [];
    collection_observable = kb.collectionObservable(new Backbone.Collection([{ name: 'name1' }, { name: 'name2' }]), { view_model: DestroyableViewModel, store });
    assert.equal(DestroyableViewModel.view_models.length, 2, 'Created: 2');

    kb.release(collection_observable);
    assert.equal(DestroyableViewModel.view_models.length, 2, 'All destroyed');

    store.destroy(); store = null;

    // all instances in the collection's store were released when it was destroyed (to remove potential cycles)
    assert.equal(DestroyableViewModel.view_models.length, 0, 'All destroyed');

    // simple view model
    store = new kb.Store();
    SimpleViewModel.view_models = [];
    collection_observable = kb.collectionObservable(new Backbone.Collection([{ name: 'name1' }, { name: 'name2' }]), { view_model: SimpleViewModel, store });
    assert.equal(SimpleViewModel.view_models.length, 2, 'Created: 2');

    kb.release(collection_observable);
    assert.equal(SimpleViewModel.view_models.length, 2, 'Remaining: 2');
    _.each(SimpleViewModel.view_models, (view_model) => { assert.ok(view_model.prop, 'Prop destroyed'); });

    store.destroy(); store = null;

    // all instances in the collection's store were released when it was destroyed (to remove potential cycles)
    assert.equal(SimpleViewModel.view_models.length, 2, 'Destroyed: 2');
    _.each(SimpleViewModel.view_models, (view_model) => { assert.ok(!view_model.prop, 'Prop destroyed'); });

    assert.equal(kb.statistics.registeredStatsString('all released'), 'all released', 'Cleanup: stats'); kb.statistics = null;
  });

  it('kb.release destructiveness', () => {
    kb.statistics = new kb.Statistics(); // turn on stats

    const array = ['Hello', 'Friend'];
    kb.release(array);
    assert.ok(_.isEqual(array, ['Hello', 'Friend']), 'preserves arrays');

    const obj = { name: 'Fred' };
    kb.release(obj);
    assert.ok(_.isEqual(obj, { name: 'Fred' }), 'preserves objects');

    const view_model = {
      array: ['Hello', 'Friend'],
      obj: { name: 'Fred' },
      value: ko.observable('hi'),
      array_value1: ko.observable(['Hello', 'Friend']),
      array_value2: ko.observableArray(['Hello', 'Friend']),
      model_value: kb.viewModel(new Backbone.Model()),
      collection_value: kb.collectionObservable(new Backbone.Collection()),
    };

    kb.release(view_model);
    assert.ok(_.isEqual(view_model.array, ['Hello', 'Friend']), 'preserves arrays');
    assert.ok(_.isEqual(view_model.obj, { name: 'Fred' }), 'preserves arrays');
    assert.ok(!view_model.value, 'releases observables: value');
    assert.ok(!view_model.array_value1, 'releases observables: array_value1');
    assert.ok(!view_model.array_value2, 'releases observables: array_value2');
    assert.ok(!view_model.model_value, 'releases observables: model_value');
    assert.ok(!view_model.collection_value, 'releases observables: collection_value');

    assert.equal(kb.statistics.registeredStatsString('all released'), 'all released', 'Cleanup: stats'); kb.statistics = null;
  });
});
