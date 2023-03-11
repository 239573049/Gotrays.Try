import * as React from 'react';
import { WorkbenchEditorService } from '@opensumi/ide-editor/lib/browser';

interface IProps {
  work: WorkbenchEditorService;
  editorService:WorkbenchEditorService
}

interface IState {

}

export default class FunctionView extends React.Component<IProps, IState> {

  constructor(props) {
    super(props)
  }

  render(): React.ReactNode {
    return (<>
      <div style={{ margin: '5px' }}>
        预览功能实现  
      </div>
      </>)
  }
}

