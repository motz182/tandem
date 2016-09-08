import { Action } from "tandem-common/actions";
import { WrapBus } from "mesh";
import { IEntity } from "tandem-common/ast";
import { bindable } from "tandem-common/decorators";
import { BaseEntity } from "tandem-common/ast";
import { IHTMLNodeEntity } from "./base";
import { MetadataKeys } from "tandem-front-end/constants";
import { HTMLNodeEntity } from "./node";
import { diffArray, patchArray } from "tandem-common/utils/array";
import { parseCSS, parseCSSStyle } from "tandem-html-extension/ast";
import { EntityFactoryDependency } from "tandem-common/dependencies";
import { IDOMSection, NodeSection } from "tandem-html-extension/dom";
import { INamed, IValued, IExpression } from "tandem-common";
import { HTMLElementExpression, HTMLAttributeExpression } from "tandem-html-extension/ast";
import { AttributeChangeAction, TreeNodeAction, PropertyChangeAction } from "tandem-common/actions";
import { CSSRuleExpression, IHTMLElementAttributeEntity } from "tandem-html-extension/ast";
import * as sift from "sift";

export class HTMLElementEntity extends HTMLNodeEntity<HTMLElementExpression> implements IHTMLNodeEntity {

  get attributes(): Array<BaseEntity<any> & IHTMLElementAttributeEntity> {
    return <any>this.children.filter((child) => child.source.constructor === HTMLAttributeExpression);
  }

  getInitialMetadata() {
    return Object.assign(super.getInitialMetadata(), {
      [MetadataKeys.LAYER_DEPENDENCY_NAME]: "element"
    });
  }

  get cssRuleExpressions(): Array<CSSRuleExpression> {
    return [];
  }

  createSection(): IDOMSection {
    return new NodeSection(document.createElement(this.source.name));
  }

  static mapSourceChildren(source: HTMLElementExpression): Array<IExpression> {
    return source.children;
  }

  removeAttribute(name: string) {
    for (const attribute of this.attributes) {
      if (attribute.name === name) {
        this.removeChild(attribute);
      }
    }
  }

  getAttribute(name: string) {
    const attribute = this.getAttributeEntity(name);
    return attribute ? attribute.value : undefined;
  }

  setAttribute(name: string, value: any) {
    const attribute = this.getAttributeEntity(name);
    if (!attribute) {
      const expr = new HTMLAttributeExpression(name, value, null);
      this.source.appendChild(expr);
      const entity = new HTMLAttributeEntity(expr);
      this.appendChild(entity);
      return entity;
    }
    attribute.value = value;
  }

  hasAttribute(name: string) {
    return !!this.getAttributeEntity(name);
  }

  getAttributeEntity(name: string): IHTMLElementAttributeEntity {
    return this.attributes.find((attribute) => attribute.name === name);
  }

  cloneLeaf() {
    return new (this.constructor as any)(this.source);
  }

  protected onChildAction(action: Action) {
    super.onChildAction(action);

    if (!(this.section instanceof NodeSection)) {
      return;
    }
    const element = <Element>this.section.targetNode;

    if (action.target.parent === this && action.target.source instanceof HTMLAttributeExpression) {
      if (action.type === TreeNodeAction.NODE_REMOVING) {
        element.removeAttribute(action.target.name);
      } else if (action.type === PropertyChangeAction.PROPERTY_CHANGE || action.type === TreeNodeAction.NODE_ADDED) {
        element.setAttribute(action.target.name, action.target.value);
      }
    }
  }
}

export class HTMLAttributeEntity extends BaseEntity<HTMLAttributeExpression> {

  public name: string;

  @bindable()
  public value: any;

  updateFromLoaded() {
    this.name = this.source.name;
    this.value = this.source.value;
  }

  get hasLoadableValue() {
    return typeof this.source.value === "object";
  }

  getInitialMetadata() {
    return Object.assign(super.getInitialMetadata(), {
      [MetadataKeys.SELECTABLE]: false
    });
  }

  compare(entity: HTMLAttributeEntity) {
    return super.compare(entity) && entity.name === this.name;
  }

  patch(entity: HTMLAttributeEntity) {
    super.patch(entity);
    this.value = entity.value;
  }

  async load() {
    await super.load();
    if (this.hasLoadableValue) {
      this.value = (<IValued><any>this.firstChild).value;
    }
  }

  mapSourceChildren() {
    return this.hasLoadableValue ? [this.source.value] : [];
  }

  cloneLeaf() {
    return new HTMLAttributeEntity(this.source);
  }
}

export const defaultAttributeFactoryDependency = new EntityFactoryDependency(HTMLAttributeExpression, HTMLAttributeEntity);