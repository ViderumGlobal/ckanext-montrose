import ckan.plugins.toolkit as toolkit
from datetime import datetime
from ckan.common import OrderedDict, _, json, request, c, g, response
from urllib import urlencode
import ckan.lib.helpers as h
import ckan.plugins as p
import ckan.model as model

from ckan.logic.validators import resource_id_exists, package_id_exists

# TODO: Re-organize and re-factor helpers

def _get_ctx():
    return {'model': model, 
            'session': model.Session,
            'user': 'sysadmin'}

def _get_action(action, context_dict, data_dict):
    return p.toolkit.get_action(action)(context_dict, data_dict)

def montrose_get_newly_released_data(limit=4):
    try:
        pkg_search_results = toolkit.get_action('package_search')(data_dict={
            'sort': 'metadata_modified desc',
            'rows': limit,
        })['results']

    except toolkit.ValidationError, search.SearchError:
        return []
    else:
        pkgs = []
        for pkg in pkg_search_results:
            package = toolkit.get_action('package_show')(data_dict={
                'id': pkg['id']
            })
            modified = datetime.strptime(package['metadata_modified'].split('T')[0], '%Y-%m-%d')
            package['human_metadata_modified'] = modified.strftime("%d %B %Y")
            pkgs.append(package)
        return pkgs


def montrose_convert_time_format(package):
    modified = datetime.strptime(package['metadata_modified'].split('T')[0], '%Y-%m-%d')
    return modified.strftime("%d %B %Y")


def montrose_replace_or_add_url_param(name, value):
    params = request.params.items()
    #params = set(params)

    for k, v in params:
        if k != name:
            continue
        params.remove((k, v))

    params.append((name, value))

    controller = c.controller
    action = c.action

    url = h.url_for(controller=controller, action=c.action, name=c.name)

    params = [(k, v.encode('utf-8') if isinstance(v, basestring) else str(v))
                  for k, v in params]
    return url + u'?' + urlencode(params)


def get_resourceview_resource_package(resource_view_id):
    if not resource_view_id:
        return None
    
    data_dict = {
        'id': resource_view_id
    }
    resource_view = toolkit.get_action('resource_view_show')({}, data_dict)

    data_dict = {
        'id': resource_view['resource_id']
    }
    resource = toolkit.get_action('resource_show')({}, data_dict)

    data_dict = {
        'id': resource['package_id']
    }
    package = toolkit.get_action('package_show')({}, data_dict)

    return [resource_view, resource, package]

def organization_list():
    return _get_action('organization_list', {},
                      {'all_fields': True, 
                       'include_extras': True, 
                       'include_followers': True})

def get_organization_views(name, type='chart builder'):
    data = _get_action('organization_show',{},
                      {'id':name, 
                       'include_datasets': True})
        
    result = []
    package_names = data.pop('packages', [])
    if any(package_names):
        for _ in package_names:
            package = _get_action('package_show', {}, {'id': _['name']})
            if not package['num_resources'] > 0:
                continue
            
            if type == 'chart builder':
                resource_views = map(lambda p: _get_action('resource_view_list', {}, 
                                                          {'id': p['id']}), package['resources'])
                if any(resource_views):
                    map(lambda l: result.extend(filter(lambda i: i['view_type'].lower() == type, l)), resource_views)
                    
            elif type.lower() == 'maps':
                result.extend(filter(lambda r: r['format'].lower() in ['geojson', 'gjson'], package['resources']))
            
            else:
                pass
            # Raise not handled exception
            
    return result


def get_resource_views(package):
    result = []
    resource_views = map(lambda p: _get_action('resource_view_list', {}, 
                                              {'id': p['id']}), package['resources'])
    if any(resource_views):
        map(lambda l: result.extend(l), resource_views)
        
    return result
    

def get_dataset_resource_views(package_id):
    if not package_id_exists(package_id, _get_ctx()):
        return []
    
    dataset = _get_action('package_show', {}, {'id': package_id})
    return get_resource_views(dataset)
    
def get_dataset_chart_resource_views(package_id):
    if not package_id_exists(package_id, _get_ctx()):
        return []
    
    return filter(lambda i: i['view_type'] == 'Chart builder', 
                  get_dataset_resource_views(package_id))
    
class CountryViews(object):
    def __init__(self):
        self.charts_cache = {}
        self.maps_cache = {}
        
    def get_charts(self, name):
        if name not in self.charts_cache:
            result = []
            for item in get_organization_views(name):
                result.append({'value': item['id'], 'text': item['title']})
                
            self.charts_cache.update({name: result})
            
        return self.charts_cache.get(name)
    
    def get_maps(self, name):
        if name not in self.maps_cache:
            result = []
            for item in get_organization_views(name, type='Maps'):
                result.append({'value': item['id'], 'text': 'UNNAMED' if item['name'] == '' else item['name']})
                
            self.maps_cache.update({name: result})
            
        return self.maps_cache.get(name)
        
country_views = CountryViews()

def montrose_get_resource_url(id):
    if not resource_id_exists(id, _get_ctx()):
        return None
    
    data = _get_action('resource_show', {}, {'id': id})
    return data['url']