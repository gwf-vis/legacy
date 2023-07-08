import { Component, Host, h, ComponentInterface, Prop, Watch, State } from '@stencil/core';
import leaflet from 'leaflet';

export type MapView = {
  center: leaflet.LatLngExpression;
  zoom?: number;
  options?: leaflet.ZoomPanOptions;
};

export type PluginDefinition = {
  import: string;
  containerProps?: any;
  props?: any;
};

export type PluginDefinitions = {
  data: PluginDefinition;
  hidden?: PluginDefinition[];
  sidebar?: PluginDefinition[];
  main?: PluginDefinition[];
};

export type GlobalInfo = {
  [key: string]: any;
};

export type PluginType = 'data' | 'hidden' | 'sidebar' | 'main';

@Component({
  tag: 'gwf-vis-host',
  styleUrl: 'gwf-vis-host.css',
  shadow: true,
})
export class GwfVisHost implements ComponentInterface {
  private mapElement: HTMLDivElement;
  private invisiblePluginContainer: HTMLDivElement;
  private map: leaflet.Map;
  private sidebar: leaflet.Control;
  private sidebarElement: HTMLGwfVisHostSidebarElement;
  private layerControl: leaflet.Control.Layers;
  private dataPluginInstance: HTMLElement;
  private pluginNameAndClassMap = new Map<string, any>();
  private pluginDefinitionAndInstanceMap = new Map<PluginDefinition, HTMLElement>();
  private globalInfo: GlobalInfo;

  @State() loadingActive = true;

  @Prop() serverFileApiBasePath: string;
  @Prop() imports: { [name: string]: string };
  @Prop() customVariables: { [name: string]: { rawVariables: string[]; handlerString: string } };
  @Prop() plugins: PluginDefinitions;
  @Prop() preferCanvas: boolean = false;

  @Prop() view: MapView;

  @Watch('view')
  handleViewChange(view: MapView) {
    this.map?.setView(view?.center || [0, 0], view?.zoom || 0, view?.options);
  }

  componentDidLoad() {
    this.initialize();
  }

  render() {
    return (
      <Host>
        <div id="map" ref={el => (this.mapElement = el)}></div>
        <div id="invisible-plugin-container" hidden ref={el => (this.invisiblePluginContainer = el)}></div>
        {this.loadingActive && (
          <div id="loading" class="leaflet-control leaflet-control-layers">
            Loading...
          </div>
        )}
      </Host>
    );
  }

  private async initialize() {
    if (!this.map) {
      await this.initializeMap();
      await this.initializeSidebar();
      await this.loadPlugins();
      this.loadingActive = false;
    }
  }

  private async initializeMap() {
    this.map = leaflet.map(this.mapElement, { preferCanvas: this.preferCanvas });
    this.handleViewChange(this.view);
    await this.initializeLayerControl();
    this.map.zoomControl.setPosition('topright');
  }

  private async initializeSidebar() {
    this.sidebar?.remove();
    const sidebarControl = leaflet.Control.extend({
      onAdd: () => {
        this.sidebarElement = leaflet.DomUtil.create('gwf-vis-host-sidebar');
        this.sidebarElement.classList.add('leaflet-control-layers');
        this.stopEventPropagationToTheMapElement(this.sidebarElement);
        return this.sidebarElement;
      },
    });
    this.sidebar = new sidebarControl({ position: 'topleft' });
    this.addControlToMap(this.sidebar);
  }

  private async initializeCustomControl(element: HTMLElement) {
    const customControl = leaflet.Control.extend({
      onAdd: () => {
        element.classList.add('leaflet-control-layers');
        this.stopEventPropagationToTheMapElement(element);
        return element;
      },
    });
    const customControlInstance = new customControl({ position: 'bottomright' });
    // TODO may add the instance to a dict or map
    this.addControlToMap(customControlInstance);
  }

  private async loadPlugins() {
    try {
      await this.importPlugins();
      if (!this.plugins?.data) {
        throw new Error('You must define a data plugin.');
      }
      await this.loadPlugin('data', this.plugins.data);
      for (const plugin of this.plugins.hidden || []) {
        await this.loadPlugin('hidden', plugin);
      }
      for (const plugin of this.plugins.main || []) {
        await this.loadPlugin('main', plugin);
      }
      for (const plugin of this.plugins.sidebar || []) {
        await this.loadPlugin('sidebar', plugin);
      }
    } catch (e) {
      alert(e?.message ?? 'Fail to load the plugins.');
      throw e;
    }
  }

  private async importPlugins() {
    try {
      for (const [name, url] of Object.entries(this.imports || {})) {
        const actualUrl = url?.startsWith('@') ? url.replace('@', this.serverFileApiBasePath) : url;
        const pluginModule = await import(actualUrl);
        // TODO may find a better way to find the exported class we want
        const pluginClass = Object.values(pluginModule).find(something => something?.['__PLUGIN_TAG_NAME__']);
        const pluginTagName = pluginClass?.['__PLUGIN_TAG_NAME__'];
        if (!pluginTagName) {
          throw new Error('Fail to find the plugin class.');
        }
        this.definePlugin(pluginTagName, pluginClass as CustomElementConstructor);
        if (!customElements.get(pluginTagName)) {
          throw new Error('Fail to register the plugin.');
        }
        this.pluginNameAndClassMap.set(name, pluginClass);
      }
    } catch (e) {
      alert(e?.message ?? 'Fail to import the plugins.');
      throw e;
    }
  }

  private async loadPlugin(type: PluginType, plugin: PluginDefinition) {
    const pluginInstance = await this.createPluginInstance(plugin);
    switch (type) {
      case 'data':
        this.dataPluginInstance = pluginInstance;
      case 'hidden':
        this.invisiblePluginContainer?.append(pluginInstance);
        break;
      case 'main': {
        const itemContainerElement = document.createElement('gwf-vis-host-main-item-container');
        itemContainerElement.header = await pluginInstance?.['obtainHeader']?.();
        itemContainerElement.containerProps = plugin?.['containerProps'];
        itemContainerElement.append(pluginInstance);
        await this.initializeCustomControl(itemContainerElement);
        break;
      }
      case 'sidebar': {
        const itemContainerElement = document.createElement('gwf-vis-host-sidebar-item-container');
        itemContainerElement.header = await pluginInstance?.['obtainHeader']?.();
        itemContainerElement.containerProps = plugin?.['containerProps'];
        itemContainerElement.append(pluginInstance);
        this.sidebarElement?.append(itemContainerElement);
        break;
      }
    }
    this.pluginDefinitionAndInstanceMap.set(plugin, pluginInstance);
  }

  private async createPluginInstance(plugin: PluginDefinition) {
    const pluginTagName = this.pluginNameAndClassMap?.get(plugin?.import)?.['__PLUGIN_TAG_NAME__'];
    const pluginInstance = document.createElement(pluginTagName);
    this.assignProps(pluginInstance, {
      ...plugin.props,
      leaflet,
      customVariables: this.customVariables,
      mapInstance: this.map,
      delegateOfFetchingData: this.fetchData,
      delegateOfUpdatingGlobalInfo: this.updateGlobalInfo,
      delegateOfAddingToMap: this.addLayer,
      delegateOfRemovingFromMap: this.removeLayer,
      globalInfoDict: this.globalInfo,
    });
    return pluginInstance;
  }

  private async initializeLayerControl() {
    this.layerControl = leaflet.control.layers();
    this.addControlToMap(this.layerControl);
  }

  private definePlugin(tagName: string, plugin: CustomElementConstructor) {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, plugin);
    }
  }

  private assignProps(target: any, source: any) {
    Object.entries(source || {}).forEach(([key, value]) => (target[key] = value));
  }

  private stopEventPropagationToTheMapElement(element: HTMLElement) {
    element.addEventListener('mouseover', () => {
      if (!document.body.classList.contains('leaflet-dragging')) {
        this.map.dragging.disable();
      }
      this.map.scrollWheelZoom.disable();
      this.map.doubleClickZoom.disable();
    });
    element.addEventListener('mouseup', () => {
      if (this.map.dragging.enabled()) {
        this.map.dragging.disable();
      }
    });
    element.addEventListener('mouseout', () => {
      this.map.dragging.enable();
      this.map.scrollWheelZoom.enable();
    });
  }

  private addControlToMap = async (control: leaflet.Control) => {
    control.addTo(this.map);
  };

  private addLayer = async (layer: leaflet.Layer, name: string, type: 'base-layer' | 'overlay', active = false) => {
    if (this.layerControl) {
      switch (type) {
        case 'base-layer':
          this.layerControl.addBaseLayer(layer, name);
          break;
        case 'overlay':
          this.layerControl.addOverlay(layer, name);
          break;
      }
    }
    if (active) {
      layer.addTo(this.map);
    }
  };

  private removeLayer = (layer: leaflet.Layer) => {
    if (layer) {
      this.layerControl?.removeLayer(layer);
      layer.remove();
    }
  };

  private updateGlobalInfo = (globalInfo: GlobalInfo) => {
    this.globalInfo = globalInfo;
    this.pluginDefinitionAndInstanceMap.forEach(instance => ((instance as any).globalInfo = this.globalInfo));
  };

  private fetchData = async (query: any) => {
    return await (this.dataPluginInstance as any)?.fetchData(query);
  };
}
