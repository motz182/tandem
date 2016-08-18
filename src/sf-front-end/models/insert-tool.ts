
import { Action } from "sf-core/actions";
import { IActor } from "sf-core/actors";
import { inject } from "sf-core/decorators";
import { Service } from "sf-core/services";
import { startDrag } from "sf-front-end/utils/component";
import { MAIN_BUS_NS } from "sf-core/dependencies";
import { BoundingRect } from "sf-core/geom";
import { EntityFactoryDependency } from "sf-core/dependencies";
import { IVisibleEntity, IContainerEntity } from "sf-core/entities";
import { BaseEditorTool, IEditorTool, IEditor } from "sf-front-end/models";
import { MouseAction, SetToolAction, SelectAction } from "sf-front-end/actions";

export abstract class InsertTool extends BaseEditorTool {

  readonly cursor: string = "crosshair";
  readonly name: string =  "insert";

  @inject(MAIN_BUS_NS)
  readonly bus: IActor;

  readonly resizable: boolean = true;

  didInject() {
    super.didInject();

    // deselect all
    this.bus.execute(new SelectAction());
  }

  abstract get displayEntityToolFactory(): { create(editor: IEditor): IEditorTool }
  abstract createSource(): any;

  async canvasMouseDown(action: MouseAction) {

    const activeEntity = <IContainerEntity>this.editor.activeEntity;
    const entity: IVisibleEntity = <IVisibleEntity>(await activeEntity.appendSourceChildNode(this.createSource()))[0];
    this.bus.execute(new SelectAction(entity));

    const capabilities = entity.display.capabilities;

    let left = 0;
    let top  = 0;

    if (capabilities.movable) {
      left = (action.originalEvent.pageX - this.editor.transform.left) / this.editor.transform.scale;
      top  = (action.originalEvent.pageY - this.editor.transform.top) / this.editor.transform.scale;
    }

    entity.display.position = { left, top };

    const complete = () => {
      // TODO - activeEntity.file.save() instead
      this.workspace.file.save();
      this.bus.execute(new SetToolAction(this.displayEntityToolFactory));
    };

    if (capabilities.resizable && this.resizable) {

      startDrag(action.originalEvent, (event, { delta }) => {

        const width  = (delta.x) / this.editor.transform.scale;
        const height = (delta.y) / this.editor.transform.scale;

        entity.display.bounds = new BoundingRect(left, top, left + width, top + height);

      }, complete);
    } else {
      complete();
    }
  }
}