import { Action } from "@tandem/common";
import { WrapBus } from "mesh";
import {
  BoundingRect,
  watchProperty,
  flattenTree,
  calculateAbsoluteBounds
} from "@tandem/common";
import {
  DOMNodeType,
  querySelectorAll,
  SyntheticDOMNode,
  SyntheticDOMText,
  SyntheticDocument,
  SyntheticDOMElement,
  SyntheticCSSStyleDeclaration,
} from "../dom";

import * as ReactDOM from "react-dom";

import { BaseRenderer } from "./base";
import { BaseDOMNodeEntity } from "../entities";

export class SyntheticDOMRenderer extends BaseRenderer {

  private _computedStyles: any = {};

  getComputedStyle(uid: string) {
    if (this._computedStyles[uid]) return this._computedStyles[uid];
    const element = this.element.querySelector(`[data-uid="${uid}"]`);
    return this._computedStyles[uid] = element ? getComputedStyle(element) : undefined;
  }

  async fetchComputedStyle(uid: string) {
    return this.getComputedStyle(uid);
  }

  update() {
    this._computedStyles = {};

    return new Promise((resolve) => {
      // render immediately to the DOM element
      ReactDOM.render(this.entity.render(), this.element, () => {
        const syntheticComponentsBySourceUID = {};

        for (const component of flattenTree(this.entity)) {
          syntheticComponentsBySourceUID[component.uid] = component;
        }

        const rects = {};

        for (const node of this.element.querySelectorAll("*")) {
          const element = <HTMLElement>node;
          if (!element.dataset) continue;
          const uid = element.dataset["uid"];
          const sourceComponent: BaseDOMNodeEntity<any, any> = syntheticComponentsBySourceUID[uid];
          rects[uid] = BoundingRect.fromClientRect(element.getBoundingClientRect());
          if (sourceComponent) {
            sourceComponent.target = <HTMLElement>node;
          }
        }

        this.setRects(rects);
        resolve();
      });
    });
  }
}