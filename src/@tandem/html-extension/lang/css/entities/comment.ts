import { NodeSection } from "@tandem/html-extension/dom";
import { ICSSRuleEntity } from "./base";
import { CSSCommentExpression } from "../ast";
import { BaseEntity, IEntity } from "@tandem/common/lang";
import { EntityFactoryDependency } from "@tandem/common/dependencies";

export class CSSCommentEntity extends BaseEntity<CSSCommentExpression> {


  cloneLeaf() {
    return new CSSCommentEntity(this.source);
  }
}

export const cssCommentEntityFactoryDependency = new EntityFactoryDependency(CSSCommentExpression, CSSCommentEntity);