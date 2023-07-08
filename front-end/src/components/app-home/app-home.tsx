import { Component, ComponentInterface, Env, h, Host, State } from '@stencil/core';
import '@hey-web-components/monaco-editor';
import { TreeNode } from '../app-tree-view/app-tree-view';
import defaultPythonScript from './default_python_script.txt';
import { obtainDbInfo } from './obtain-db-info';
import { alertController } from '@ionic/core';
import { HeyMonacoEditor } from '@hey-web-components/monaco-editor';
import polygonLayerSnippet from './snippets/polygon-layer-snippet.txt';
import variableAndDimensionControlSnippet from './snippets/variable-and-dimension-control-snippet.txt';
import userSelectionSnippet from './snippets/user-selection-snippet.txt';
import metadataSnippet from './snippets/metadata-snippet.txt';
import lineChartSnippet from './snippets/line-chart-snippet.txt';

export interface User {
  username: string;
  role: string;
}

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.css',
  scoped: true,
})
export class AppHome implements ComponentInterface {
  private readonly EXTENSION_NAME_AND_LANGUAGE_DICT = {
    js: 'javascript',
    py: 'python',
    json: 'json',
  };

  private monacoEditorElement: HeyMonacoEditor;

  @State() fileTree: TreeNode;
  @State() user: User;
  @State() selectedFilePath: string;
  @State() selectedTab = 'scripts';
  @State() scriptOutput = '';

  async componentDidLoad() {
    await this.checkPAWSLogin();

    await this.fetchFileTree();
    await this.fetchUser();
  }

  render() {
    return (
      <Host>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>
              <img src="./assets/icon/gwf-simple-horizontal.svg" style={{ maxHeight: '48px', contentFit: 'cover' }}></img>
            </ion-title>
            <ion-text slot="end">{this.user?.username || 'Guest'}</ion-text>
            <ion-buttons slot="end">
              <ion-button
                title={this.user ? 'Sign out' : 'Sign in'}
                href={
                  this.user ? undefined : `https://cas.usask.ca/cas/login?service=${encodeURIComponent(window.location.href + (window.location.href.endsWith('/') ? '' : '/'))}`
                }
                onClick={async () => {
                  if (this.user) {
                    await fetch(`${Env.SERVER_BASE_URL}/auth/sign-out`, {
                      method: 'POST',
                      credentials: 'include',
                    });
                    this.fetchUser();
                    window.location.href = `https://cas.usask.ca/cas/logout?service=${encodeURIComponent(window.location.href + (window.location.href.endsWith('/') ? '' : '/'))}`;
                  }
                }}
              >
                <ion-icon name={this.user ? 'log-out' : 'log-in'} slot="icon-only" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content scrollY={false}>
          <ion-grid>
            <ion-row>
              <ion-col size="3" style={{ padding: '0' }}>
                <ion-row style={{ padding: '0' }}>
                  <ion-col size="12">
                    <ion-card>
                      <ion-toolbar color="secondary">
                        <ion-segment scrollable value={this.selectedTab} onIonChange={({ detail }) => (this.selectedTab = detail.value)}>
                          <ion-segment-button value="scripts">Scripts</ion-segment-button>
                          <ion-segment-button value="datasets">Datasets</ion-segment-button>
                          <ion-segment-button value="plugins">Plugins</ion-segment-button>
                          <ion-segment-button value="files">Files</ion-segment-button>
                        </ion-segment>
                      </ion-toolbar>
                      <ion-card-content>
                        {this.selectedTab === 'scripts' && this.renderScriptsView()}
                        {this.selectedTab === 'datasets' && this.renderDatasetsView()}
                        {this.selectedTab === 'plugins' && this.renderPluginsView()}
                        {this.selectedTab === 'files' && this.renderFilesView()}
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                </ion-row>
              </ion-col>
              <ion-col size="9">
                <ion-row>
                  <ion-col size="12" style={{ padding: '0', height: '70%' }}>
                    <ion-card>
                      <ion-toolbar color="secondary">
                        <ion-title>{this.selectedFilePath || 'No File Selected'}</ion-title>
                        <ion-buttons slot="end">
                          <ion-button title="Save" onClick={() => this.updateFile(this.selectedFilePath, this.monacoEditorElement.value)}>
                            <ion-icon slot="icon-only" name="save"></ion-icon>
                          </ion-button>
                          <ion-button
                            title="Run"
                            onClick={async () => {
                              const response = await fetch(`${Env.SERVER_BASE_URL}/file/run`, {
                                method: 'POST',
                                credentials: 'include',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  code: this.monacoEditorElement.value,
                                }),
                              });
                              if (response.ok) {
                                const data = await response.json();
                                const id = data.id;
                                this.scriptOutput += '\n' + data.output;
                                if (data.result) {
                                  window.open(`./#/vis/${this.user?.username || 'guest'}/${id}`);
                                }
                              }
                            }}
                          >
                            <ion-icon slot="icon-only" name="play"></ion-icon>
                          </ion-button>
                          <ion-button title="Clear">
                            <ion-icon slot="icon-only" name="trash"></ion-icon>
                          </ion-button>
                          <ion-button title="Documentation" href="https://github.com/gwf-vis/v1-monorepo/tree/main/docs">
                            <ion-icon slot="icon-only" name="help"></ion-icon>
                          </ion-button>
                        </ion-buttons>
                      </ion-toolbar>
                      {/* TODO considering using flex or resize observer for the height */}
                      <ion-card-content style={{ height: 'calc(100% - 56px)' }}>
                        <hey-monaco-editor
                          ref={(el: HeyMonacoEditor) => {
                            this.monacoEditorElement = el;
                            this.monacoEditorElement.addEventListener('editorInitialized', ({ detail }: CustomEvent) => {
                              const monaco = detail?.monaco;
                              monaco.languages.registerCompletionItemProvider('python', {
                                provideCompletionItems: function () {
                                  return {
                                    suggestions: [
                                      { label: 'gwfvis - add polygon layer', insertText: polygonLayerSnippet },
                                      { label: 'gwfvis - add variable and dimension control', insertText: variableAndDimensionControlSnippet },
                                      { label: 'gwfvis - add user selection', insertText: userSelectionSnippet },
                                      { label: 'gwfvis - add metadata', insertText: metadataSnippet },
                                      { label: 'gwfvis - add line chart', insertText: lineChartSnippet },
                                    ].map(value => ({
                                      kind: monaco.languages.CompletionItemKind.Function,
                                      documentation: 'Add a polygon layer',
                                      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                      ...value,
                                    })),
                                  };
                                },
                              });
                            });
                          }}
                        />
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                  <ion-col size="12">
                    <ion-card style={{ padding: '0', height: '30%' }}>
                      <ion-card-content style={{ height: '100%', overflowY: 'auto' }}>
                        {this.scriptOutput?.split('\n').map(line =>
                          line.match(/^data:image\/*;*,*/) ? (
                            <div>
                              <img src={line} style={{ maxHeight: '10rem' }} />
                              <a href={line} download>
                                Download
                              </a>
                            </div>
                          ) : (
                            <p>{line}</p>
                          ),
                        )}
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                </ion-row>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-content>
      </Host>
    );
  }

  private renderScriptsView() {
    const children = this.fileTree?.children;
    const scriptTree = {
      name: 'root',
      children: children?.map(child => ({
        ...child,
        name: child.name,
        children: child.children?.find(child => child.name === 'scripts')?.children,
      })),
    };
    return (
      <app-tree-view
        data={scriptTree}
        onItemClicked={async ({ detail }) => {
          if (!detail.children) {
            const rootPath = `${this.fileTree.path}/`;
            const path = detail.path?.slice(rootPath.length);
            const fileContent = await this.fetchFileContent(path);
            if (this.monacoEditorElement) {
              this.monacoEditorElement.value = fileContent;
              this.monacoEditorElement.language = this.EXTENSION_NAME_AND_LANGUAGE_DICT[path.split('.').pop()];
            }
            this.selectedFilePath = path;
          }
        }}
        onItemRightClicked={({ detail }) => {
          if (detail.editable) {
            if (detail.children) {
              const fileName = prompt('Creating a new file');
              if (fileName !== null) {
                this.createFile(`${this.user?.username}/scripts/${fileName}`, defaultPythonScript);
              }
            } else {
              if (confirm(`Delete ${detail.name}?`)) {
                this.deleteFile(`${this.user?.username}/scripts/${detail.name}`);
              }
            }
          }
        }}
      />
    );
  }

  private renderDatasetsView() {
    const children = this.fileTree?.children;
    const datasetTree = {
      name: 'root',
      children: children?.map(child => ({
        ...child,
        name: child.name,
        children: child.children?.find(child => child.name === 'datasets')?.children,
      })),
    };
    return (
      <app-tree-view
        data={datasetTree}
        onItemClicked={async ({ detail }) => {
          if (!detail.children) {
            const rootPath = `${this.fileTree.path}/`;
            const path = detail.path?.slice(rootPath.length);
            const response = await fetch(`${Env.SERVER_BASE_URL}/file/fetch/${path}`, { credentials: 'include' });
            const dbBuffer = await response.arrayBuffer();
            const dbInfo = await obtainDbInfo(dbBuffer);
            if (this.monacoEditorElement) {
              this.monacoEditorElement.value = dbInfo;
              this.monacoEditorElement.language = 'text';
            }
            this.selectedFilePath = path;
          }
        }}
      />
    );
  }

  private renderPluginsView() {
    const children = this.fileTree?.children;
    const pluginTree = {
      name: 'root',
      children: children?.map(child => ({
        ...child,
        name: child.name,
        children: child.children?.find(child => child.name === 'plugins')?.children,
      })),
    };
    return (
      <app-tree-view
        data={pluginTree}
        onItemClicked={async ({ detail }) => {
          if (!detail.children) {
            const rootPath = `${this.fileTree.path}/`;
            const path = detail.path?.slice(rootPath.length);
            const fileContent = await this.fetchFileContent(path);
            if (this.monacoEditorElement) {
              this.monacoEditorElement.value = fileContent;
              this.monacoEditorElement.language = this.EXTENSION_NAME_AND_LANGUAGE_DICT[path.split('.').pop()];
            }
            this.selectedFilePath = path;
          }
        }}
        onItemRightClicked={({ detail }) => {
          if (detail.editable) {
            if (detail.children) {
              const fileName = prompt('Creating a new file');
              if (fileName !== null) {
                this.createFile(`${this.user?.username}/plugins/${fileName}`, '');
              }
            } else {
              if (confirm(`Delete ${detail.name}?`)) {
                this.deleteFile(`${this.user?.username}/plugins/${detail.name}`);
              }
            }
          }
        }}
      />
    );
  }

  private renderFilesView() {
    return (
      <ion-list>
        <app-tree-view
          data={
            this.fileTree ||
            JSON.parse(
              `{"path":"/home/node/dist/files","name":"files","children":[{"path":"/home/node/dist/files/public","name":"public","children":[{"path":"/home/node/dist/files/public/assets","name":"assets","children":[]},{"path":"/home/node/dist/files/public/datasets","name":"datasets","children":[{"path":"/home/node/dist/files/public/datasets/airbnb.gwfvisdb","name":"airbnb.gwfvisdb"},{"path":"/home/node/dist/files/public/datasets/catchment.gwfvisdb","name":"catchment.gwfvisdb"},{"path":"/home/node/dist/files/public/datasets/chm_1000.gwfvisdb","name":"chm_1000.gwfvisdb"},{"path":"/home/node/dist/files/public/datasets/chm_100000.gwfvisdb","name":"chm_100000.gwfvisdb"},{"path":"/home/node/dist/files/public/datasets/mesh.gwfvisdb","name":"mesh.gwfvisdb"}]},{"path":"/home/node/dist/files/public/plugins","name":"plugins","children":[{"path":"/home/node/dist/files/public/plugins/default","name":"default","children":[{"path":"/home/node/dist/files/public/plugins/default/gwf-vis-plugin-data-fetcher.js","name":"gwf-vis-plugin-data-fetcher.js"},{"path":"/home/node/dist/files/public/plugins/default/gwf-vis-plugin-dimension-control.js","name":"gwf-vis-plugin-dimension-control.js"},{"path":"/home/node/dist/files/public/plugins/default/gwf-vis-plugin-geojson-layer.js","name":"gwf-vis-plugin-geojson-layer.js"},{"path":"/home/node/dist/files/public/plugins/default/gwf-vis-plugin-legend.js","name":"gwf-vis-plugin-legend.js"},{"path":"/home/node/dist/files/public/plugins/default/gwf-vis-plugin-line-chart.js","name":"gwf-vis-plugin-line-chart.js"},{"path":"/home/node/dist/files/public/plugins/default/gwf-vis-plugin-metadata.js","name":"gwf-vis-plugin-metadata.js"},{"path":"/home/node/dist/files/public/plugins/default/gwf-vis-plugin-radar-chart.js","name":"gwf-vis-plugin-radar-chart.js"},{"path":"/home/node/dist/files/public/plugins/default/gwf-vis-plugin-selection.js","name":"gwf-vis-plugin-selection.js"},{"path":"/home/node/dist/files/public/plugins/default/gwf-vis-plugin-tile-layer.js","name":"gwf-vis-plugin-tile-layer.js"},{"path":"/home/node/dist/files/public/plugins/default/gwf-vis-plugin-variable-control.js","name":"gwf-vis-plugin-variable-control.js"},{"path":"/home/node/dist/files/public/plugins/default/index.js","name":"index.js"},{"path":"/home/node/dist/files/public/plugins/default/p-2b42538a.js","name":"p-2b42538a.js"},{"path":"/home/node/dist/files/public/plugins/default/p-3cb4e4d7.js","name":"p-3cb4e4d7.js"},{"path":"/home/node/dist/files/public/plugins/default/p-5ed12820.js","name":"p-5ed12820.js"},{"path":"/home/node/dist/files/public/plugins/default/p-9ae2d10a.js","name":"p-9ae2d10a.js"}]},{"path":"/home/node/dist/files/public/plugins/sample","name":"sample","children":[{"path":"/home/node/dist/files/public/plugins/sample/sample-plugin.js","name":"sample-plugin.js"}]}]},{"path":"/home/node/dist/files/public/scripts","name":"scripts","children":[{"path":"/home/node/dist/files/public/scripts/catchment.py","name":"catchment.py"},{"path":"/home/node/dist/files/public/scripts/chm.py","name":"chm.py"},{"path":"/home/node/dist/files/public/scripts/color_config.py","name":"color_config.py"},{"path":"/home/node/dist/files/public/scripts/line-chart.py","name":"line-chart.py"},{"path":"/home/node/dist/files/public/scripts/mesh.py","name":"mesh.py"},{"path":"/home/node/dist/files/public/scripts/metadata.py","name":"metadata.py"},{"path":"/home/node/dist/files/public/scripts/multi-line-chart.py","name":"multi-line-chart.py"},{"path":"/home/node/dist/files/public/scripts/multiselect.py","name":"multiselect.py"},{"path":"/home/node/dist/files/public/scripts/polygons.py","name":"polygons.py"},{"path":"/home/node/dist/files/public/scripts/radar-chart.py","name":"radar-chart.py"},{"path":"/home/node/dist/files/public/scripts/series_data.py","name":"series_data.py"},{"path":"/home/node/dist/files/public/scripts/welcome.py","name":"welcome.py"}]}]},{"path":"/home/node/dist/files/shw940","name":"shw940","children":[{"path":"/home/node/dist/files/shw940/datasets","name":"datasets","children":[]},{"path":"/home/node/dist/files/shw940/history","name":"history","children":[{"path":"/home/node/dist/files/shw940/history/1661206762991.json","name":"1661206762991.json"},{"path":"/home/node/dist/files/shw940/history/1661207432371.json","name":"1661207432371.json"},{"path":"/home/node/dist/files/shw940/history/1661207931949.json","name":"1661207931949.json"},{"path":"/home/node/dist/files/shw940/history/1661208134111.json","name":"1661208134111.json"},{"path":"/home/node/dist/files/shw940/history/1661210552894.json","name":"1661210552894.json"},{"path":"/home/node/dist/files/shw940/history/1661210572620.json","name":"1661210572620.json"},{"path":"/home/node/dist/files/shw940/history/1661210656279.json","name":"1661210656279.json"},{"path":"/home/node/dist/files/shw940/history/1661212137993.json","name":"1661212137993.json"},{"path":"/home/node/dist/files/shw940/history/1661275639389.json","name":"1661275639389.json"},{"path":"/home/node/dist/files/shw940/history/1661276204918.json","name":"1661276204918.json"},{"path":"/home/node/dist/files/shw940/history/1661280170120.json","name":"1661280170120.json"},{"path":"/home/node/dist/files/shw940/history/1661280418345.json","name":"1661280418345.json"},{"path":"/home/node/dist/files/shw940/history/1661280744062.json","name":"1661280744062.json"},{"path":"/home/node/dist/files/shw940/history/1661280887183.json","name":"1661280887183.json"},{"path":"/home/node/dist/files/shw940/history/1661280902950.json","name":"1661280902950.json"},{"path":"/home/node/dist/files/shw940/history/1662057264936.json","name":"1662057264936.json"},{"path":"/home/node/dist/files/shw940/history/1662057774673.json","name":"1662057774673.json"},{"path":"/home/node/dist/files/shw940/history/1662057814732.json","name":"1662057814732.json"},{"path":"/home/node/dist/files/shw940/history/1662057845936.json","name":"1662057845936.json"},{"path":"/home/node/dist/files/shw940/history/1662057909940.json","name":"1662057909940.json"},{"path":"/home/node/dist/files/shw940/history/1662058178330.json","name":"1662058178330.json"},{"path":"/home/node/dist/files/shw940/history/1662058839120.json","name":"1662058839120.json"},{"path":"/home/node/dist/files/shw940/history/1662058881284.json","name":"1662058881284.json"},{"path":"/home/node/dist/files/shw940/history/1662058945200.json","name":"1662058945200.json"},{"path":"/home/node/dist/files/shw940/history/1662058970938.json","name":"1662058970938.json"},{"path":"/home/node/dist/files/shw940/history/1662059009811.json","name":"1662059009811.json"},{"path":"/home/node/dist/files/shw940/history/1662135864772.json","name":"1662135864772.json"},{"path":"/home/node/dist/files/shw940/history/1662136065759.json","name":"1662136065759.json"},{"path":"/home/node/dist/files/shw940/history/1662136208738.json","name":"1662136208738.json"},{"path":"/home/node/dist/files/shw940/history/1662136319395.json","name":"1662136319395.json"},{"path":"/home/node/dist/files/shw940/history/1662136356738.json","name":"1662136356738.json"},{"path":"/home/node/dist/files/shw940/history/1662136494501.json","name":"1662136494501.json"},{"path":"/home/node/dist/files/shw940/history/1662136672399.json","name":"1662136672399.json"},{"path":"/home/node/dist/files/shw940/history/1662137350122.json","name":"1662137350122.json"},{"path":"/home/node/dist/files/shw940/history/1662137366441.json","name":"1662137366441.json"},{"path":"/home/node/dist/files/shw940/history/1662137475725.json","name":"1662137475725.json"},{"path":"/home/node/dist/files/shw940/history/1662137517810.json","name":"1662137517810.json"},{"path":"/home/node/dist/files/shw940/history/1662137548519.json","name":"1662137548519.json"},{"path":"/home/node/dist/files/shw940/history/1662137745071.json","name":"1662137745071.json"},{"path":"/home/node/dist/files/shw940/history/1662137763044.json","name":"1662137763044.json"},{"path":"/home/node/dist/files/shw940/history/1662137844561.json","name":"1662137844561.json"},{"path":"/home/node/dist/files/shw940/history/1662141733897.json","name":"1662141733897.json"},{"path":"/home/node/dist/files/shw940/history/1662141768597.json","name":"1662141768597.json"}]},{"path":"/home/node/dist/files/shw940/plugins","name":"plugins","children":[{"path":"/home/node/dist/files/shw940/plugins/my-plugin.js","name":"my-plugin.js"}]},{"path":"/home/node/dist/files/shw940/scripts","name":"scripts","children":[{"path":"/home/node/dist/files/shw940/scripts/test.py","name":"test.py"}]}]}]}`,
            )
          }
          onItemClicked={async ({ detail }) => {
            if (!detail.children) {
              const rootPath = `${this.fileTree.path}/`;
              const path = detail.path?.slice(rootPath.length);
              const fileContent = await this.fetchFileContent(path);
              if (this.monacoEditorElement) {
                this.monacoEditorElement.value = fileContent;
                this.monacoEditorElement.language = this.EXTENSION_NAME_AND_LANGUAGE_DICT[path.split('.').pop()];
              }
              this.selectedFilePath = path;
            }
          }}
          onItemRightClicked={async ({ detail }) => {
            if (detail.editable) {
              if (detail.children) {
                const ionAlert = await alertController.create({
                  message: 'What are you going to do?',
                  buttons: [
                    {
                      text: 'Create File',
                      handler: () => {
                        const fileName = prompt('Creating a new file');
                        const rootPath = `${this.fileTree.path}/`;
                        const filePath = `${detail.path?.slice(rootPath.length)}/${fileName}`;
                        if (filePath !== null) {
                          this.createFile(filePath, '');
                        }
                      },
                    },
                    {
                      text: 'Upload File',
                      handler: async () => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = async () => {
                          const file = input.files[0];
                          const formData = new FormData();
                          formData.append('file', file);
                          const rootPath = `${this.fileTree.path}/`;
                          const filePath = `${detail.path?.slice(rootPath.length)}`;
                          const response = await fetch(`${Env.SERVER_BASE_URL}/file/upload?path=${filePath}`, { method: 'POST', body: formData });
                          if (response.ok) {
                            alert('Uploaded.');
                            this.fetchFileTree();
                          } else {
                            alert('Fail to upload.');
                          }
                        };
                        input.click();
                      },
                    },
                    { text: 'Cancel', role: 'cancel' },
                  ],
                });
                await ionAlert.present();
              } else {
                if (confirm(`Delete ${detail.name}?`)) {
                  const rootPath = `${this.fileTree.path}/`;
                  const filePath = detail.path?.slice(rootPath.length);
                  this.deleteFile(filePath);
                }
              }
            }
          }}
        />
      </ion-list>
    );
  }

  private async checkPAWSLogin() {
    const ticketMatch = window.location.href.match(/\?ticket=ST-.+-cas/);
    if (ticketMatch) {
      const [_, ticket] = ticketMatch[0].split('ticket=');
      const hrefWithoutQueryParameters = window.location.href.split('?ticket=')[0];
      const service = encodeURIComponent(hrefWithoutQueryParameters + (hrefWithoutQueryParameters.endsWith('/') ? '' : '/'));
      await fetch(`${Env.SERVER_BASE_URL}/auth/sign-in?service=${service}&ticket=${ticket}`, { method: 'POST', credentials: 'include' });
      window.location.href = hrefWithoutQueryParameters;
    }
  }

  private async fetchFileTree() {
    try {
      const response = await fetch(`${Env.SERVER_BASE_URL}/file/tree`, { credentials: 'include' });
      const fileTree = await response.json();
      fileTree?.children?.forEach(userDirectoryFileTree => this.setFileTreeEditable(userDirectoryFileTree, userDirectoryFileTree.name === this.user?.username));
      this.fileTree = fileTree;
    } catch (e) {
      console.log(e);
    }
  }

  private async setFileTreeEditable(tree: any, editable: boolean) {
    if (!tree) {
      return;
    }
    tree.editable = editable;
    tree.children?.forEach(child => this.setFileTreeEditable(child, editable));
  }

  private async fetchFileContent(path: string) {
    const response = await fetch(`${Env.SERVER_BASE_URL}/file/fetch/${path}`, { credentials: 'include' });
    const text = await response.text();
    return text;
  }

  private async fetchUser() {
    const response = await fetch(`${Env.SERVER_BASE_URL}/user/me`, { credentials: 'include' });
    if (response.ok) {
      this.user = await response.json();
    } else {
      this.user = undefined;
    }
    this.fetchFileTree();
  }

  private async createFile(path: string, content: string = '') {
    await fetch(`${Env.SERVER_BASE_URL}/file?path=${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    this.fetchFileTree();
  }

  private async updateFile(path: string, content: string) {
    await fetch(`${Env.SERVER_BASE_URL}/file?path=${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    this.fetchFileTree();
  }

  private async deleteFile(path: string) {
    await fetch(`${Env.SERVER_BASE_URL}/file?path=${path}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    this.fetchFileTree();
  }
}
