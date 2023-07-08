import os
from flask import json
import matplotlib.pyplot as plt
import base64
from io import BytesIO
import datetime

SERVER_ENDPOINT = 'http://localhost:5000'


def render(data):
    filePath = os.environ['RESULT_FILE_PATH']
    with open(filePath, 'w') as file:
        text = dumps_json(data)
        file.write(text)
    print(f'{datetime.datetime.now()} - The visualization has been rendered in a new tab.')


def loads_json(data):
    return json.loads(data)


def dumps_json(data):
    return json.dumps(data)


def render_pyplot_figure():
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    bufferValue = buffer.getvalue()
    buffer.close()
    b64 = base64.b64encode(bufferValue)
    b64String = b64.decode('utf-8')
    dataUrl = f'data:image/png;base64,{b64String}'
    print(dataUrl)


# config helpers

def load_vis_config():
    return {
        'imports': {
            'data-fetcher': '@/public/plugins/default/gwf-vis-plugin-data-fetcher.js',
            'tile-layer': '@/public/plugins/default/gwf-vis-plugin-tile-layer.js',
            'geojson-layer': '@/public/plugins/default/gwf-vis-plugin-geojson-layer.js',
            'user-selection': '@/public/plugins/default/gwf-vis-plugin-selection.js',
            'metadata': '@/public/plugins/default/gwf-vis-plugin-metadata.js',
            'line-chart': '@/public/plugins/default/gwf-vis-plugin-line-chart.js',
            'radar-chart': '@/public/plugins/default/gwf-vis-plugin-radar-chart.js',
            'dimension-control': '@/public/plugins/default/gwf-vis-plugin-dimension-control.js',
            'variable-control': '@/public/plugins/default/gwf-vis-plugin-variable-control.js',
            'legend': '@/public/plugins/default/gwf-vis-plugin-legend.js'
        },
        'plugins': {
            'data': {
                'import': 'data-fetcher',
                'props': {
                    'sqliteWorkerUrl': '//gwf-vis.usask.ca/v1/assets/sqljs/worker.sql-wasm.js',
                    'remoteSqlRunnerUrl': '//gwf-vis.usask.ca/v1/api/file/query'
                }
            },
        }
    }


def add_plugin(vis_config, plugin_config, container='hidden'):
    plugins = vis_config.get('plugins')
    if vis_config['plugins'] is None:
        vis_config['plugins'] = {}
    if container == 'data':
        plugins['data'] = plugin_config
    else:
        plugin_container = plugins.get(container)
        if plugin_container is None:
            plugin_container = plugins[container] = []
        plugin_container.append(plugin_config)


def add_map_element(vis_config, plugin, props=None, containerProps=None):
    plugin_config = {
        'import': plugin,
        'props': props,
        'containerProps': containerProps
    }
    add_plugin(
        vis_config,
        plugin_config,
        'hidden'
    )
    return plugin_config


def add_sidebar_element(vis_config, plugin, props=None, containerProps=None):
    plugin_config = {
        'import': plugin,
        'props': props,
        'containerProps': containerProps
    }
    add_plugin(
        vis_config,
        plugin_config,
        'sidebar'
    )
    return plugin_config


def add_main_view_element(vis_config, plugin, props=None, containerProps=None):
    plugin_config = {
        'import': plugin,
        'props': props,
        'containerProps': containerProps
    }
    add_plugin(
        vis_config,
        plugin_config,
        'main'
    )
    return plugin_config


def update_custom_variables(plugin_config, custom_variables):
    plugin_config['customVariables'] = custom_variables


def update_custom_variable(plugin_config, key, value):
    if plugin_config['customVariables'] is None:
        plugin_config['customVariables'] = {}
    plugin_config['customVariables'][key] = value


def update_props(plugin_config, props):
    plugin_config['props'] = props


def update_prop(plugin_config, key, value):
    if plugin_config['props'] is None:
        plugin_config['props'] = {}
    plugin_config['props'][key] = value


def update_container_props(plugin_config, props):
    plugin_config['containerProps'] = props


def update_container_prop(plugin_config, key, value):
    if plugin_config['containerProps'] is None:
        plugin_config['containerProps'] = {}
    plugin_config['containerProps'][key] = value


SATELITTE_LAYER = {
    'import': 'tile-layer',
    'props': {
        'layerName': 'Satelitte',
        'type': 'base-layer',
        'urlTemplate': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        'options': {
            'attribution': 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
    }
}

SATELITTE_LAYER_PROPS = {
    'layerName': 'Satelitte',
    'type': 'base-layer',
    'urlTemplate': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    'options': {
            'attribution': 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
}
