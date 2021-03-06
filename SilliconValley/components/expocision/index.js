'use strict';

app.expocision = kendo.observable({
    onShow: function () {},
    afterShow: function () {}
});

// START_CUSTOM_CODE_expocision
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_expocision
(function (parent) {
    var dataProvider = app.data.notasHibrido,
        fetchFilteredData = function (paramFilter, searchFilter) {
            var model = parent.get('expocisionModel'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },
        processImage = function (img) {
            if (!img) {
                var empty1x1png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=';
                img = 'data:image/png;base64,' + empty1x1png;
            } else if (img.slice(0, 4) !== 'http' &&
                img.slice(0, 2) !== '//' && img.slice(0, 5) !== 'data:') {
                var setup = dataProvider.setup || {};
                img = setup.scheme + ':' + setup.url + setup.appId + '/Files/' + img + '/Download';
            }

            return img;
        },
        flattenLocationProperties = function (dataItem) {
            var propName, propValue,
                isLocation = function (value) {
                    return propValue && typeof propValue === 'object' &&
                        propValue.longitude && propValue.latitude;
                };

            for (propName in dataItem) {
                if (dataItem.hasOwnProperty(propName)) {
                    propValue = dataItem[propName];
                    if (isLocation(propValue)) {
                        dataItem[propName] =
                            kendo.format('Latitude: {0}, Longitude: {1}',
                                propValue.latitude, propValue.longitude);
                    }
                }
            }
        },
        dataSourceOptions = {
            // type: 'everlive',
            // transport: {
            //     typeName: 'Exposicion',
            //     dataProvider: dataProvider
            // },

            transport: {
                read: {
                    url: servidor + 'expositor/listar'
                }
            },
            requestStart: function () {
                // kendo.ui.progress($("#products"), true);
            },
            requestEnd: function () {
                // kendo.ui.progress($("#products"), false);
            },
            // change: function () {
            //     $("#products").html(kendo.render(template, this.view()));
            // },
            change: function (e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    dataItem['PictureUrl'] =
                        processImage(dataItem['Picture']);

                    flattenLocationProperties(dataItem);
                }
            },
            error: function (e) {
                if (e.xhr) {
                    alert(JSON.stringify(e.xhr));
                }
            },
            schema: {
                model: {
                    fields: {
                        'tema': {
                            field: 'tema',
                            defaultValue: ''
                        },
                        'nombreEmpresa': {
                            field: 'nombreEmpresa',
                            defaultValue: ''
                        },
                        'fechaExposicion': {
                            field: 'fechaExposicion',
                            defaultValue: ''
                        },
                        'Picture': {
                            field: 'Picture',
                            defaultValue: ''
                        },
                    },
                    icon: function () {
                        var i = 'globe';
                        return kendo.format('km-icon km-{0}', i);
                    }
                }
            },
            serverFiltering: true,
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        expocisionModel = kendo.observable({
            dataSource: dataSource,
            goToNotas: function (e) {
                // app.mobileApp.navigate('#components/nota/view.html?filter=' + encodeURIComponent(JSON.stringify({
                //     field: 'expositor',
                //     value: e.data.id,
                //     operator: 'eq'
                // })));
                idExposicion = e.data.id;
                app.mobileApp.navigate('#components/nota/view.html');
                
            },
            itemClick: function (e) {

                app.mobileApp.navigate('#components/expocision/details.html?uid=' + e.data.id);

            },
            detailsShow: function (e) {
                var item = e.view.params.uid,
                    dataSource = expocisionModel.get('dataSource'),
                    // itemModel = dataSource.getByUid(item);
                    itemModel = dataSource.get(item);
                if (itemModel.fechaExposicion) {
                    itemModel.fechaExposicion = kendo.toString(new Date(itemModel.fechaExposicion), "d/M/yyyy h:mm tt")
                }

                if (itemModel.imagen) {
                    itemModel.imagen = "data:image/png;base64," + itemModel.imagen
                }

                expocisionModel.set('currentItem', null);
                expocisionModel.set('currentItem', itemModel);
            },
            currentItem: null
        });

    // if (typeof dataProvider.sbProviderReady === 'function') {
    //     dataProvider.sbProviderReady(function dl_sbProviderReady() {
    //         parent.set('expocisionModel', expocisionModel);
    //     });
    // } else {
    parent.set('expocisionModel', expocisionModel);
    // }

    parent.set('onShow', function (e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null;

        fetchFilteredData(param);
    });
})(app.expocision);

// START_CUSTOM_CODE_expocisionModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_expocisionModel