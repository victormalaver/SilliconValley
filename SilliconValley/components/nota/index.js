'use strict';

var idExposicion;
app.nota = kendo.observable({
    onShow: function () {},
    afterShow: function (e) {
        // idExposicion = JSON.parse(e.view.params.filter);
        // idExposicion = idExposicion.value;
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
            // type: 'everlive',
            // transport: {
            //     typeName: 'Nota',
            //     dataProvider: dataProvider,
            //     read: {
            //         headers: {
            //             "X-Everlive-Expand": JSON.stringify({
            //                 "Categoria": {
            //                     "TargetTypeName": "Categoria",
            //                     "ReturnAs": "CategoriaExpanded",
            //                     "SingleField": "Categoria"
            //                 },
            //                 "Tipo": {
            //                     "TargetTypeName": "Tipo",
            //                     "ReturnAs": "TipoExpanded",
            //                     "SingleField": "Tipo"
            //                 },
            //                 "Users": {
            //                     "TargetTypeName": "Users",
            //                     "ReturnAs": "UsersExpanded",
            //                     "SingleField": "DisplayName"
            //                 }
            //             })
            //         }
            //     }
            // },
            transport: {
                read: {
                    url: servidor + 'nota/listar'
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
                        'comentario': {
                            field: 'comentario',
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
                        field: 'comentario',
                        operator: 'contains',
                        value: searchVal
                    };
                }
                fetchFilteredData(notaModel.get('paramFilter'), searchFilter);
            },
            itemClick: function (e) {
                app.mobileApp.navigate('#components/nota/details.html?uid=' + e.data.uid);
            },
            openModalDelete: function () {
                $("#mensajeModal").html("¿Desea eliminar la nota?");
                $("#btnAccionModalEliminar").css('display', 'block');
                $("#btnAccionModalVerificar").css('display', 'none');
                openModal("modalview-alert");
            },
            addClick: function () {
                var currentUser = app.user;
                // var currentUserId = currentUser.Id;

                // console.log(currentUser);
                // console.log(currentUserId);

                // log on the console all the user properties
                // for (var i in currentUser) {
                //     console.log("User account field " + i + ": " + currentUser[i]);
                // }

                if (!currentUser) {
                    $("#btnAccionModalEliminar").css('display', 'none');
                    $("#btnAccionModalVerificar").css('display', 'block');
                    $("#mensajeModal").html("Inicie sesión para agregar una nota");
                    openModal("modalview-alert");

                } else {
                    app.mobileApp.navigate('#components/nota/add.html');
                }

            },
            goToView: function () {
                app.mobileApp.navigate('#components/home/view.html');
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
                    "¿Está seguro que deseas eliminar la nota?",
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

                var categorias = "";
                if (itemModel.categorias) {
                    for (var i = 0; i < itemModel.categorias.length; i++) {
                        categorias = categorias + itemModel.categorias[i].descripcion + " ";
                    }
                }
                $("#categoriaCurrent").text(categorias);

                var tipos = "";
                if (itemModel.tipos) {
                    for (var i = 0; i < itemModel.tipos.length; i++) {
                        tipos = tipos + itemModel.tipos[i].descripcion + " ";
                    }
                }
                $("#tipoCurrent").text(tipos);

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
                comentario: '',
            });
            //cargamos ds categoria
            var dsCategoria = app.categoria.categoriaModel.dataSource;
            dsCategoria.fetch(function () {
                var html = []
                var data = dsCategoria.data();
                for (var i = 0; i < data.length; i++) {
                    html.push('<label class="km-listview-label"><span>' + data[i].descripcion + '</span><input name="inputCategoriasAdd" value="' + data[i].id + '" data-role="switch" type="checkbox" class="km-widget km-icon km-check"></label>');
                }
                $("#listCategoriasAdd").html(html);
            });
            //cargamos ds tipo 
            var dsTipo = app.tipo.tipoModel.dataSource;
            dsTipo.fetch(function () {
                var html = []
                var data = dsTipo.data();
                for (var i = 0; i < data.length; i++) {
                    html.push('<label class="km-listview-label"><span>' + data[i].descripcion + '</span><input name="inputTiposAdd" value="' + data[i].id + '" data-role="switch" type="checkbox" class="km-widget km-icon km-check"></label>');
                }
                $("#listTiposAdd").html(html);
            });

        },
        onSaveClick: function (e) {
            var nota = [];
            var item = {};


            $("input[name='inputCategoriasAdd']").each(function (index) {
                var Id = $(this).attr("value");
                if ($(this).is(':checked')) {
                    item["categoria"] = Id;
                }
            });


            $("input[name='inputTiposAdd']").each(function (index) {
                var Id = $(this).attr("value");
                if ($(this).is(':checked')) {
                    item["tipo"] = Id;
                }
            });







            var addFormData = this.get('addFormData'),
                dataSource = notaModel.get('dataSource');

            item["comentario"] = addFormData.comentario;
            nota.push(item);

            console.log(nota);

            return;

            $.ajax({

                url: servidor + "nota/agregar",

                type: "POST",
                dataType: 'json',
                data: {
                    categoria: Categorias,
                    tipo: Tipos,
                    comentario: addFormData.comentario,
                    usuario: 1
                },
                // async: false,
                success: function (data) {
                    console.log(data);
                },
                error: function () {
                    console.log("error ds alertas");
                }
            });

            return;

            dataSource.add({
                transport: {
                    create: {
                        url: "nota/agregar",
                        type: "post"
                    }
                },
                categoria: Categorias,
                tipo: Tipos,
                comentario: addFormData.comentario,
                usuario: 1
            });

            dataSource.one('change', function (e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.sync();
            dataSource.read();
        },
        onCloseModalCategoriaAdd: function (e) {
            $("#addCategoria").val("");
            $("input[name='inputCategoriasAdd']").each(function (index) {
                var id = $(this).attr("value");
                // console.log(id);
                if ($(this).is(':checked')) {
                    console.log($(this).parent().text());
                    $("#addCategoria").val($("#addCategoria").val() + $(this).parent().text() + "  ");
                }
            });
            closeModal('modalview-categoria-add');
        },
        onCloseModalTipoAdd: function (e) {
            $("#addTipo").val("");
            $("input[name='inputTiposAdd']").each(function (index) {
                var id = $(this).attr("value");
                // console.log(id);
                if ($(this).is(':checked')) {
                    console.log($(this).parent().text());
                    $("#addTipo").val($("#addTipo").val() + $(this).parent().text() + "  ");
                }
            });
            closeModal('modalview-tipo-add');
        }

    }));

    parent.set('editItemViewModel', kendo.observable({
        onShow: function (e) {

            var itemUid = e.view.params.uid,
                dataSource = notaModel.get('dataSource'),
                itemData = dataSource.getByUid(itemUid);

            var categorias = "";
            if (itemData.categorias) {
                for (var i = 0; i < itemData.categorias.length; i++) {
                    categorias = categorias + itemData.categorias[i].descripcion + " ";
                }
            }
            $("#categoriasCurrent").text(categorias);


            var tipos = "";
            if (itemData.tipos) {
                for (var i = 0; i < itemData.tipos.length; i++) {
                    tipos = tipos + itemData.tipos[i].descripcion + " ";
                }
            }
            $("#tipoCurrent").text(tipos);

            //cargamos ds categoria
            var dsCategoria = app.categoria.categoriaModel.dataSource;
            dsCategoria.fetch(function () {
                var html = []
                var data = dsCategoria.data();
                for (var i = 0; i < data.length; i++) {
                    html.push('<label class="km-listview-label"><span>' + data[i].descripcion + '</span><input name="inputCategoriasEdit" value="' + data[i].id + '" data-role="switch" type="checkbox" class="km-widget km-icon km-check"></label>');
                }
                $("#listCategoriasEdit").html(html);

                $("input[name='inputCategoriasEdit']").each(function (index) {
                    var id = $(this).attr("value");
                    if (itemData.categorias) {
                        for (var i = 0; i < itemData.categorias.length; i++) {
                            if (itemData.categorias[i].id == id) {
                                $(this).attr("checked", "checked");
                            }
                        }
                    }
                });
            });


            //cargamos ds tipo 
            var dsTipo = app.tipo.tipoModel.dataSource;
            dsTipo.fetch(function () {
                var html = []
                var data = dsTipo.data();
                console.log(data);
                for (var i = 0; i < data.length; i++) {
                    html.push('<label class="km-listview-label"><span>' + data[i].descripcion + '</span><input name="inputTiposEdit" value="' + data[i].id + '" data-role="switch" type="checkbox" class="km-widget km-icon km-check"></label>');
                }
                $("#listTiposEdit").html(html);

                $("input[name='inputTiposEdit']").each(function (index) {
                    var id = $(this).attr("value");
                    if (itemData.tipos) {
                        for (var i = 0; i < itemData.tipos.length; i++) {
                            if (itemData.tipos[i].id == id) {
                                $(this).attr("checked", "checked");
                            }
                        }
                    }
                });
            });







            this.set('itemData', itemData);
            this.set('editFormData', {
                tipo: tipos,
                categoria: categorias,
                comentario: itemData.comentario,
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
        },
        onCloseModalCategoriaEdit: function (e) {
            $("#editCategoria").val("");
            $("input[name='inputCategoriasEdit']").each(function (index) {
                var id = $(this).attr("value");
                // console.log(id);
                if ($(this).is(':checked')) {
                    console.log($(this).parent().text());
                    $("#editCategoria").val($("#editCategoria").val() + $(this).parent().text() + "  ");
                }
            });
            closeModal('modalview-categoria-edit');
        },
        onCloseModalTipoEdit: function (e) {
            $("#editTipo").val("");
            $("input[name='inputTiposEdit']").each(function (index) {
                var id = $(this).attr("value");
                // console.log(id);
                if ($(this).is(':checked')) {
                    console.log($(this).parent().text());
                    $("#editTipo").val($("#editTipo").val() + $(this).parent().text() + "  ");
                }
            });
            closeModal('modalview-tipo-edit');
        }
    }));

    // if (typeof dataProvider.sbProviderReady === 'function') {
    //     dataProvider.sbProviderReady(function dl_sbProviderReady() {
    //         parent.set('notaModel', notaModel);
    //     });
    // } else {
    parent.set('notaModel', notaModel);
    // }

    parent.set('onShow', function (e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null;
        fetchFilteredData(param);
    });
})(app.nota);

// START_CUSTOM_CODE_notaModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_notaModel