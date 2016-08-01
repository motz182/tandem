import "./index.scss";
import * as React from "react";

import { STAGE_CANVAS_MOUSE_DOWN, ZoomAction } from "sf-front-end/actions";
import PreviewLayerComponent from "./preview";
import ToolsLayerComponent from "./tools";
import IsolateComponent  from "sf-front-end/components/isolate";
import { Editor } from "sf-front-end/models";
import { Dependencies, BusDependency } from "sf-core/dependencies";

export default class EditorStageLayersComponent extends React.Component<{ editor: Editor, dependencies: Dependencies, zoom: number }, any> {

  private _mousePosition: any;
  private _toolsHidden: any;
  private _previousZoom: number;

  onMouseDown(event) {
   this.bus.execute(Object.assign({}, event, {
      type: {
        mousedown: STAGE_CANVAS_MOUSE_DOWN
      }[event.type]
    }));
  }

  get bus() {
    return BusDependency.getInstance(this.props.dependencies);
  }

  componentWillUpdate(props: any) {
    if (props.zoom !== this.props.zoom) {
      requestAnimationFrame(this._center.bind(this, props.zoom, this.props.zoom));
    }
  }

  componentDidMount() {
    const isolateBody = (this.refs as any).isolate.body;
    isolateBody.scrollTop = isolateBody.scrollHeight / 2;
    isolateBody.scrollLeft = isolateBody.scrollWidth / 2;
    this._mousePosition = { left: 0, top: 0 };
  }

  onMouseMove = (event) => {
    this._mousePosition = {
      left: event.pageX,
      top : event.pageY
    };
  }

  onWheel = (event) => {
    this.onMouseMove(event);
    if (event.metaKey) {
      event.preventDefault();
      this.bus.execute(new ZoomAction(event.deltaY / 250));
    }
  }

  onScroll = () => {
    if (!this._hideTools()) {
      this.forceUpdate();
    }
  }

  _hideTools() {
    const paused = !!this._toolsHidden;
    if (this._toolsHidden) clearTimeout(this._toolsHidden);
    this._toolsHidden = setTimeout(this._showTools, 100);
    return paused;
  }

  _showTools = () => {
    this._toolsHidden = void 0;
    this.forceUpdate();
  }

  _center = (newZoom, oldZoom) => {


    function calcPrev(value) {
      return Math.round((value / newZoom) * oldZoom);
    }

    const isolateBody = (this.refs as any).isolate.body;

    const newHeight  = isolateBody.scrollHeight;
    const prevHeight = calcPrev(newHeight);

    const newWidth  = isolateBody.scrollWidth;
    const prevWidth = calcPrev(newWidth);

    const changeLeft = (newHeight - prevHeight) / 2;
    const changeTop = (newWidth - prevWidth)   / 2;

    const scrollTop   = isolateBody.scrollTop + changeTop;
    const scrollLeft  = isolateBody.scrollLeft + changeLeft;

    isolateBody.scrollTop = scrollTop;
    isolateBody.scrollLeft = scrollLeft;
    this.forceUpdate();
  }

  render() {

    const style = {
      cursor: this.props.editor.currentTool.cursor
    };

    const entity = this.props.editor.file.entity;
    if (!entity) return null;

    return (<IsolateComponent ref="isolate" onWheel={this.onWheel} onScroll={this.onScroll} inheritCSS className="m-editor-stage-isolate">
      <div className="m-editor-stage-canvas" onMouseMove={this.onMouseMove} style={style} onMouseDown={this.onMouseDown.bind(this)}>
        <PreviewLayerComponent {...this.props} entity={entity} />
        {this._toolsHidden ? void 0 : <ToolsLayerComponent entity={entity} {...this.props} />}
      </div>
    </IsolateComponent>);
  }
}
