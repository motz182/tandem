import { Registry } from 'common/registry';
import ObservableObject from 'common/object/observable';
import { NotifierCollection } from 'common/notifiers';
import { ALL_APPLICATION_PLUGINS } from 'base/fragment/queries';
import { InitializeMessage, LoadMessage, DisposeMessage } from 'base/message-types';

class BaseApplication extends ObservableObject {

  static fragments = [];

  constructor(properties) {
    super(properties);

    // class registry such as components classes, tools, models
    this.fragments = Registry.create(void 0, this.constructor.fragments);

    // central communication object
    this.notifier = NotifierCollection.create();
    this.notifier.push(this);

    this._useFragments();
  }

  notify(message) {

  }

  _useFragments() {
    for (var fragment of this.fragments.query(ALL_APPLICATION_PLUGINS)) {
      fragment.factory.create({ app: this });
    }
  }

  /**
   * initializes the app
   */

  async initialize(config = {}) {

    this.config = config;

    // first load the app - fragments, plugins, and other things
    // may depend on asynchronous stuff here
    await this.notifier.notify(LoadMessage.create()).then(this.didLoad.bind(this));
    await this.notifier.notify(InitializeMessage.create()).then(this.didInitialize.bind(this));
  }

  /**
   * called after everything has loaded in the application
   */

  didLoad() {

  }

  /**
   * called after the application has loaded
   */

  didInitialize() {

  }

  /**
   */

  dispose() {
    this.notifier.notify(DisposeMessage.create(this));
  }
}

export default BaseApplication;