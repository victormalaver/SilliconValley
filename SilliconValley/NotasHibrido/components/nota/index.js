'use strict';

var idExposicion;
app.nota = kendo.observable({
    onShow: function () {},
    afterShow: function (e) {
        idExposicion = JSON.parse(e.view.params.filter);
        idExposicion = idExposicion.value;
    }
});

// START_CUSTOM_CODE_nota
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_nota
(function (parent) {
    var dataProvider = app.data.notasHibrido,
        fetchFilteredData = function (paramFilter, searchFilter) {
            var model = parent.get('notaModel'),
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
            type: 'everlive',
            transport: {
                typeName: 'Nota',
                dataProvider: dataProvider,
                read: {
                    headers: {
                        "X-Everlive-Expand": JSON.stringify({
                            "Categoria": {
                                "TargetTypeName": "Categoria",
                                "ReturnAs": "CategoriaExpanded",
                                "SingleField": "Categoria"
                            },
                            "Tipo": {
                                "TargetTypeName": "Tipo",
                                "ReturnAs": "TipoExpanded",
                                "SingleField": "Tipo"
                            },
                            "Users": {
                                "TargetTypeName": "Users",
                                "ReturnAs": "UsersExpanded",
                                "SingleField": "DisplayName"
                            }
                        })
                    }
                }
            },
            change: function (e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

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
                        'Nota': {
                            field: 'Nota',
                            defaultValue: ''
                        },
                        'Categoria': {
                            field: 'Categoria',
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
            serverSorting: true,
            serverPaging: true,
            pageSize: 50
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        notaModel = kendo.observable({
            dataSource: dataSource,
            searchChange: function (e) {
                var searchVal = e.target.value,
                    searchFilter;

                if (searchVal) {
                    searchFilter = {
                        field: 'Nota',
                        operator: 'contains',
                        value: searchVal
                    };
                }
                fetchFilteredData(notaModel.get('paramFilter'), searchFilter);
            },
            itemClick: function (e) {

                app.mobileApp.navigate('#components/nota/details.html?uid=' + e.dataItem.uid);

            },
            addClick: function () {
                app.mobileApp.navigate('#components/nota/add.html');
            },
            editClick: function () {
                var uid = this.currentItem.uid;
                app.mobileApp.navigate('#components/nota/edit.html?uid=' + uid);
            },
            deleteClick: function () {
                var dataSource = notaModel.get('dataSource'),
                    that = this;

                if (!navigator.notification) {
                    navigator.notification = {
                        confirm: function (message, callback) {
                            callback(window.confirm(message) ? 1 : 2);
                        }
                    };
                }

                navigator.notification.confirm(
                    "Are you sure you want to delete this item?",
                    function (index) {
                        //'OK' is index 1
                        //'Cancel' - index 2
                        if (index === 1) {
                            dataSource.remove(that.currentItem);

                            dataSource.one('sync', function () {
                                app.mobileApp.navigate('#:back');
                            });

                            dataSource.one('error', function () {
                                dataSource.cancelChanges();
                            });

                            dataSource.sync();
                        }
                    },
                    '', ["OK", "Cancel"]
                );
            },
            detailsShow: function (e) {
                var item = e.view.params.uid,
                    dataSource = notaModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.Nota) {
                    itemModel.Nota = String.fromCharCode(160);
                }

                notaModel.set('currentItem', null);
                notaModel.set('currentItem', itemModel);
            },
            currentItem: null
        });

    parent.set('addItemViewModel', kendo.observable({
        onShow: function (e) {
            // Reset the form data.
            this.set('addFormData', {
                tipo: '',
                categoria: '',
                nota: '',
            });
            //cargamos ds categoria
            var dsCategoria = app.categoria.categoriaModel.dataSource;
            dsCategoria.fetch(function () {
                var html = []
                var data = dsCategoria.data();
                for (var i = 0; i < data.length; i++) {
                    html.push('<label class="km-listview-label"><span>' + data[i].Categoria + '</span><input name="inputCategorias" value="' + data[i].Id + '" data-role="switch" type="checkbox" class="km-widget km-icon km-check"></label>');
                }
                $("#listCategorias").html(html);
            });
            //cargamos ds tipo
            var dsTipo = app.tipo.tipoModel.dataSource;
            dsTipo.fetch(function () {
                var html = []
                var data = dsTipo.data();
                for (var i = 0; i < data.length; i++) {
                    html.push('<label class="km-listview-label"><span>' + data[i].Tipo + '</span><input name="inputTipos" value="' + data[i].Id + '" data-role="switch" type="checkbox" class="km-widget km-icon km-check"></label>');
                }
                $("#listTipos").html(html);
            });

        },
        onSaveClick: function (e) {
            console.log(el.users.currentUser);
            console.log(e.view.params);
            return;
            var Categorias = [];
            $("input[name='inputCategorias']").each(function (index) {
                var Id = $(this).attr("value");
                if ($(this).is(':checked')) {
                    Categorias.push(Id);
                }
            });

            var Tipos = [];
            $("input[name='inputTipos']").each(function (index) {
                var Id = $(this).attr("value");
                if ($(this).is(':checked')) {
                    Tipos.push(Id);
                }
            });

            var addFormData = this.get('addFormData'),
                dataSource = notaModel.get('dataSource');

            dataSource.add({
                // Tipo: addFormData.tipo,
                Tipo: Tipos,
                // Categoria: addFormData.categoria,
                Categoria: Categorias,
                Nota: addFormData.nota,
                Exposicion: idExposicion,
                Users: $("#DisplayName").attr("type")
            });

            dataSource.one('change', function (e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.sync();
            dataSource.read();
        }
    }));

    parent.set('editItemViewModel', kendo.observable({
        onShow: function (e) {
            var itemUid = e.view.params.uid,
                dataSource = notaModel.get('dataSource'),
                itemData = dataSource.getByUid(itemUid);

            this.set('itemData', itemData);
            this.set('editFormData', {
                tipo: itemData.Tipo,
                categoria: itemData.Categoria,
                nota: itemData.Nota,
            });
        },
        onSaveClick: function (e) {
            var editFormData = this.get('editFormData'),
                itemData = this.get('itemData'),
                dataSource = notaModel.get('dataSource');

            // prepare edit
            itemData.set('Tipo', editFormData.tipo);
            itemData.set('Categoria', editFormData.categoria);
            itemData.set('Nota', editFormData.nota);

            dataSource.one('sync', function (e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.one('error', function () {
                dataSource.cancelChanges(itemData);
            });

            dataSource.sync();
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('notaModel', notaModel);
        });
    } else {
        parent.set('notaModel', notaModel);
    }

    parent.set('onShow', function (e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null;
        fetchFilteredData(param);
    });
})(app.nota);

// START_CUSTOM_CODE_notaModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_notaModel


function onCloseModalCategoria(e) {
    $("#categoria").val();
    $("input[name='inputCategorias']").each(function (index) {
        var id = $(this).attr("value");
        // console.log(id);
        if ($(this).is(':checked')) {
            console.log($(this).parent().text());
            $("#categoria").val($("#categoria").val() + $(this).parent().text() + "  ");
        }
    });
}

function onCloseModalTipo(e) {
    $("#tipo").val();
    $("input[name='inputTipos']").each(function (index) {
        var id = $(this).attr("value");
        // console.log(id);
        if ($(this).is(':checked')) {
            console.log($(this).parent().text());
            $("#tipo").val($("#tipo").val() + $(this).parent().text() + "  ");
        }
    });
}