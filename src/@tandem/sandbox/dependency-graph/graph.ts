import * as memoize from "memoizee";
import { getDependencyHash } from "./utils";

import { 
  IDependencyLoader,
  IResolvedDependencyInfo,
  IDependencyGraphStrategy,
  DefaultDependencyGraphStrategy,
} from "./strategies";

import { 
  Dependency,
  IDependencyData,
} from "./dependency";

import {
  Logger,
  inject,
  loggable,
  Injector,
  Observable,
  InjectorProvider,
  ActiveRecordCollection,
} from "@tandem/common";

export interface IDependencyGraphStrategyOptions {
  name?: string;
  config?: any;
}

/**
 * Singleton graph dependency for mapping and transforming application source code
 * into one bundle file.
 */

@loggable()
export class DependencyGraph extends Observable {

  protected readonly logger: Logger;

  private _collection: ActiveRecordCollection<Dependency, IDependencyData>;
  public $strategy: IDependencyGraphStrategy;

  @inject(InjectorProvider.ID)
  public $injector: Injector;

  constructor(private _strategy: IDependencyGraphStrategy) {
    super();
  }

  $didInject() {

    // temporary - this should be passed into the constructor
    this.$strategy = this._strategy || this.$injector.inject(new DefaultDependencyGraphStrategy());
    this._collection = ActiveRecordCollection.create(this.collectionName, this.$injector, (source: IDependencyData) => {
      return this.$injector.inject(new Dependency(source, this.collectionName, this));
    });

    this.logger.generatePrefix = () => `(~${this.$strategy.constructor.name}~) `;
    this.logger.verbose("Created");

    this.collection.sync();
  }

  get collection() {
    return this._collection;
  }

  createGlobalSandboxContext() {
    return this.$strategy.createGlobalSandboxContext();
  }

  getLoader(loaderOptions: any) {
    return this.$strategy.getLoader(loaderOptions);
  }

  get collectionName() {
    return "dependencyGraph";
  }

  /**
   * Looks for a loaded item. Though, it may not exist in memory, but it *may* exist in some other
   * process.
   */

  eagerFindByHash(hash): Dependency {
    return this.collection.find((entity) => entity.hash === hash);
  }

  /**
   */

  resolve(filePath: string, cwd: string): Promise<IResolvedDependencyInfo> {
    return this.$strategy.resolve(filePath, cwd);
  }

  /**
   */

  getDependency = memoize(async (ops: IResolvedDependencyInfo): Promise<Dependency> => {
    return this.eagerFindByHash(ops.hash) || await this.collection.loadOrInsertItem({ hash: ops.hash }, ops);
  }, { promise: true, normalizer: args => args[0].hash }) as (ops: IResolvedDependencyInfo) => Promise<Dependency>;

  /**
   */

  loadDependency = memoize(async (ops: IResolvedDependencyInfo): Promise<Dependency> => {
    const entry  = await this.getDependency(ops);
    const logTimer = this.logger.startTimer();
    await entry.load();
    logTimer.stop(`Loaded ${ops.filePath}`);
    return entry;
  }, { promise: true, normalizer: args => args[0].hash }) as (ops: IResolvedDependencyInfo) => Promise<Dependency>;
}
