import { Autowired } from '@opensumi/di';
import {
  Domain,
  getIcon,
  CommandContribution,
  CommandRegistry,
  ClientAppContribution,
  Command,
  URI,
  TabBarToolbarContribution,
  ToolbarRegistry,
  Schemes,
  localize,
  AppConfig,
  CommandService,
} from '@opensumi/ide-core-browser';
import { IStatusBarService } from '@opensumi/ide-status-bar';
import { IWorkspaceService } from '@opensumi/ide-workspace';
import { IFileServiceClient } from '@opensumi/ide-file-service';
import { IMainLayoutService } from '@opensumi/ide-main-layout';
import { RenderView, UsingList } from './razor/render';
import { IMenuRegistry, MenuContribution, MenuId } from '@opensumi/ide-core-browser/lib/menu/next';
import {
  BrowserEditorContribution,
  EditorComponentRegistry,
  EditorComponentRenderMode,
  IResource,
  ResourceService,
  WorkbenchEditorService,
} from '@opensumi/ide-editor/lib/browser';
import { IconType } from '@opensumi/ide-theme';
import { IconService } from '@opensumi/ide-theme/lib/browser';
import { OutputService } from '@opensumi/ide-output/lib/browser/output.service';
import FunctionView from './function';
import * as React from 'react';
import CompileInteraction from './interaction/compile.interaction';
import { parseUris } from 'web-lite/utils';
import { getQueryStringByName } from 'src/url.helper';

const REFRESH: Command = {
  id: 'test.refresh',
  iconClass: getIcon('refresh'),
  label: 'Refresh',
};

const COMPONENTS_ID = 'opensumi-samples:antd-theme';
const COMPONENTS_SCHEME_ID = 'antd-theme';
const OUTPUT_CHANNEL_ID = 'razor denbug';

export namespace EDITOR_TITLE_SAMPLE_COMMANDS {
  export const DEBUG = {
    id: 'editor-title.debug',
    label: '打开渲染和编译',
  };
}

@Domain(
  ClientAppContribution,
  BrowserEditorContribution,
  CommandContribution,
  TabBarToolbarContribution,
  MenuContribution,
)
export class SampleContribution
  implements
    ClientAppContribution,
    BrowserEditorContribution,
    CommandContribution,
    TabBarToolbarContribution,
    MenuContribution
{
  @Autowired(IStatusBarService)
  statusBarService: IStatusBarService;

  @Autowired(AppConfig)
  private readonly appConfig: AppConfig;

  @Autowired(IWorkspaceService)
  workspaceService: IWorkspaceService;

  @Autowired(IFileServiceClient)
  fileServiceClient: IFileServiceClient;

  @Autowired(OutputService)
  private readonly output: OutputService;

  @Autowired(IconService)
  protected readonly iconService: IconService;

  @Autowired(WorkbenchEditorService)
  protected readonly editorService: WorkbenchEditorService;

  @Autowired(CommandService)
  private readonly commandService: CommandService;
  
  @Autowired(IMainLayoutService)
  layoutService: IMainLayoutService;



  onDidStart() {

    this.appConfig.extensionCandidate = [
      {
        path: './connector',
        isBuiltin: true,
        isDevelopment: true,
      },
    ];

    this.getCode();
    
    this.layoutService.collectViewComponent(
      {
        id: 'global-using-view',
        name: '设置全局引用',
        component: () => {
          return <UsingList />;
        },
        hidden: false,
        priority: 1,
        weight: 1,
      },
      'explorer',
      { name: 'OpenSumi' },
    );

    // 监听输出
    window.addEventListener('message', (e) => {
      if (e.data.type === 'error') {
        // 获取输出面板通道
        const channel = this.output.getChannel(OUTPUT_CHANNEL_ID);
        channel.setVisibility(true);
        this.output.updateSelectedChannel(channel);
        channel.appendLine(`编译异常：${e.data.message}`);
      } else if (e.data.type === 'set-current-value') {
        console.log(
          'this.workbenchEditorService.currentResource',
          this.editorService.currentEditor?.monacoEditor.setValue(e.data.value),
        );
      }
    });
  }

  /**
   * 解析git地址代码
   */
  getCode(){
    var hash =  getQueryStringByName("git");

    if(hash){
      var parseUri =  parseUris(hash);
      var uri = new URI(`file://github/${parseUri.owner}/${parseUri.name}/${parseUri.specifiedFile}`);
      
      this.editorService.open(uri, {
        preview: false,
        focus: true,
        forceOpenType:{
          type:'code'
        },
        label: parseUri.specifiedFile,
      });
    }
  }

  registerMenus(registry: IMenuRegistry) {
    const menuId = 'LiteMenu';
    registry.removeMenubarItem(MenuId.MenubarTerminalMenu);
    registry.registerMenubarItem(menuId, {
      label: '自定义',
      order: 0,
    });

    registry.registerMenuItem(menuId, {
      command: REFRESH.id,
      label: '刷新',
    });

    registry.registerMenuItem(MenuId.EditorTitle, {
      command: EDITOR_TITLE_SAMPLE_COMMANDS.DEBUG.id,
      iconClass: getIcon('debug'),
      group: 'navigation',
      when: 'resource',
    });
  }

  registerToolbarItems(registry: ToolbarRegistry) {
    registry.registerItem({
      id: 'refresh_view',
      command: REFRESH.id,
      iconClass: getIcon('refresh'),
      label: 'Refresh',
      viewId: 'test',
    });
  }

  registerEditorComponent(registry: EditorComponentRegistry) {
    registry.registerEditorComponent({
      uid: COMPONENTS_ID,
      scheme: COMPONENTS_SCHEME_ID,
      component: RenderView as any,
      renderMode: EditorComponentRenderMode.ONE_PER_WORKBENCH,
    });

    registry.registerEditorComponentResolver(COMPONENTS_SCHEME_ID, (resource, results) => {
      results.push({
        type: 'component',
        componentId: COMPONENTS_ID,
      });
    });

    registry.registerEditorComponentResolver(Schemes.file, (resource, results) => {
      if (resource.uri.path.ext === `.${COMPONENTS_SCHEME_ID}`) {
        results.push({
          type: 'component',
          componentId: COMPONENTS_ID,
        });
      }
    });
  }

  registerResource(service: ResourceService) {
    service.registerResourceProvider({
      scheme: COMPONENTS_SCHEME_ID,
      provideResource: async (uri: URI): Promise<IResource<any>> => {
        const iconClass = this.iconService.fromIcon(
          '',
          'https://cdn.masastack.com/images/icon9.svg',
          IconType.Background,
        );
        return {
          uri,
          name: localize('sample.antd-components'),
          icon: iconClass!,
        };
      },
    });

  }

  registerCommands(registry: CommandRegistry) {
    registry.registerCommand(REFRESH, {
      execute: () => {
        location.reload();
      },
    });

    registry.registerCommand(EDITOR_TITLE_SAMPLE_COMMANDS.DEBUG, {
      execute: (args, options) => {
        options.holdDocumentModelRefs.forEach(async (x) => {
          // 获取输出面板通道
          const channel = this.output.getChannel(OUTPUT_CHANNEL_ID);
          channel.setVisibility(true);
          this.output.updateSelectedChannel(channel);
          
          this.editorService.open(new URI(`${COMPONENTS_SCHEME_ID}://`), {
            preview: false,
            focus: false,
            label: '渲染',
            split: 4,
          }).then(async res=>{
            var code = this.editorService.currentEditor?.monacoEditor.getValue();
            if(code){
              CompileInteraction.CompileRazor(code)
            }
          });
        });
      },
    });
  }
}
