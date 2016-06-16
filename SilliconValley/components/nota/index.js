'use strict';
app.nota = kendo.observable({
    onShow: function () {},
    afterShow: function () {}
});

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
            transport: {
                read: {
                    // url: servidor + 'nota/obtenerPorExpositor?id=1'
                },
                destroy: {
                    // url: servidor + 'nota/eliminar?id=1'
                    type: "post"
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
                if (e.data.usuario.id == idUsuario) {
                    app.mobileApp.navigate('#components/nota/details.html?uid=' + e.data.id + '&visible=block');
                } else {
                    app.mobileApp.navigate('#components/nota/details.html?uid=' + e.data.id + '&visible=none');
                }
            },
            openModalDelete: function (e) {
                $("#mensajeModal").html("¿Desea eliminar la nota?");
                $("#btnAccionModalEliminar").css('display', 'block');
                $("#btnAccionModalVerificar").css('display', 'none');
                $("#btnAccionModalEliminar").attr("idDelete", e.data.id);
                openModal("modalview-alert");
            },
            addClick: function () {
                if ($("#liInicio").css("display") !== "none") {
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
                var uid = this.currentItem.id;
                app.mobileApp.navigate('#components/nota/edit.html?uid=' + uid);
            },
            deleteClick: function () {
                var idEliminar = $("#btnAccionModalEliminar").attr("idDelete");
                $.ajax({
                    url: servidor + 'nota/eliminar/' + idEliminar,
                    type: 'DELETE',
                    success: function (data) {
                        console.log(data);
                        closeModal("modalview-alert");
                        app.mobileApp.navigate('#components/nota/view.html');
                        app.nota.onShow();
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        console.log(xhr);
                        console.log("Datos inválidos, Verifique sus datos de usuario y contraseña.");
                    }
                });
            },
            detailsShow: function (e) {

                var item = e.view.params.uid;
                var itemModel;

                $("#btnAccionModalEliminar").attr("idDelete", item);

                $.ajax({
                    url: servidor + 'nota/obtenerPorId/' + item,
                    type: 'GET',
                    success: function (datos) {
                        itemModel = datos;

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

                        $("#notaModelDetailsView div.km-rightitem").css("display", e.view.params.visible);

                        if ($("#liInicio").css("display") !== "none" || idUsuario !== itemModel.usuario.id) {
                            $("#btnGrabarAudio").css("display", "none");
                            $(".primero").css("display", "none");
                            $(".segundo").css("width", "80%");
                        } else {
                            $("#btnGrabarAudio").css("display", "block");
                            $(".primero").css("display", "block");
                            $(".segundo").css("width", "68%");
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        console.log("Datos inválidos, Verifique sus datos de usuario y contraseña.");
                    }
                });

                getAudios();

            },
            currentItem: null,

            pictureSource: null,
            destinationType: null,
            captureAudio: function (e) {
                var that = this;
                navigator.device.capture.captureAudio(that.captureSuccess, that.captureError, {
                    limit: 1
                })
            },
            captureSuccess: function (capturedFiles) {
                var i, capturesMsg = "";
                for (i = 0; i < capturedFiles.length; i += 1) {
                    capturesMsg += capturedFiles[i].fullPath;
                }
                capturesMsg = capturesMsg.replace(/\%20/g, ' ');
                $("#rutaAudio").text(capturesMsg);
                upload(capturesMsg);
            },
            captureError: function (error) {
                if (window.navigator.simulator === true) {
                    alert(error);
                } else {
                    $("#rutaAudio").text(error.code);
                }
            }


        });

    parent.set('addItemViewModel', kendo.observable({
        onShow: function (e) {
            $("#li-modalview-categoria-add").removeAttr("onclick");
            $("#li-modalview-tipo-add").removeAttr("onclick");
            
            // Reset the form data.
            this.set('addFormData', {
                tipo: '',
                categoria: '',
                comentario: '',
            });
            //cargamos ds categoria 
            var dsCategoria = app.categoria.categoriaModel.dataSource;
            dsCategoria.fetch(function () {
                var html = [];
                var data = dsCategoria.data();
                for (var i = 0; i < data.length; i++) {
                    html.push('<label class="km-listview-label"><span>' + data[i].descripcion + '</span><input name="inputCategoriasAdd" value="' + data[i].id + '" data-role="switch" type="checkbox" class="km-widget km-icon km-check"></label>');
                }
                $("#listCategoriasAdd").html(html);
                $("#li-modalview-categoria-add").attr("onclick","openModal('modalview-categoria-add')");
            });
            //cargamos ds tipo 
            var dsTipo = app.tipo.tipoModel.dataSource;
            dsTipo.fetch(function () {
                var html = [];
                var data = dsTipo.data();
                for (var i = 0; i < data.length; i++) {
                    html.push('<label class="km-listview-label"><span>' + data[i].descripcion + '</span><input name="inputTiposAdd" value="' + data[i].id + '" data-role="switch" type="checkbox" class="km-widget km-icon km-check"></label>');
                }
                $("#listTiposAdd").html(html);
                $("#li-modalview-tipo-add").attr("onclick","openModal('modalview-categoria-add')");
            });

        },
        onSaveClick: function (e) {
            var nota = {};
            var categoria = "";
            $("#addCategoria").removeClass("error");
            $("input[name='inputCategoriasAdd']").each(function (index) {
                var Id = $(this).attr("value");
                if ($(this).is(':checked')) {
                    if (categoria == "") {
                        categoria = Id;
                    } else {
                        categoria = categoria + "," + Id;
                    }

                }
            });
            if ($("#addCategoria").val() == "") {
                $("#addCategoria").addClass("error");
                return;
            }

            var tipo = "";
            $("#addTipo").removeClass("error");
            $("input[name='inputTiposAdd']").each(function (index) {
                var Id = $(this).attr("value");
                if ($(this).is(':checked')) {
                    if (tipo == "") {
                        tipo = Id;
                    } else {
                        tipo = tipo + "," + Id;
                    }
                }
            });
            if ($("#addTipo").val() == "") {
                $("#addTipo").addClass("error");
                return;
            }

            $("#comentarioAdd").removeClass("error");
            if ($("#comentarioAdd").val() == "") {
                $("#comentarioAdd").addClass("error");
                return;
            }

            $.ajax({
                url: servidor + "nota/agregar/",
                type: "POST",
                // contentType: "application/json; charset=utf-8",
                // dataType: "json",
                data: {
                    comentario: $("#comentarioAdd").val(),
                    fechaRegistro: "2016-06-10 11:11:11",
                    categorias: categoria,
                    tipos: tipo,
                    expositor_id: idExposicion,
                    usuario_id: idUsuario,
                },
                beforeSend: function () {
                    kendo.mobile.application.showLoading();
                },
                complete: function () {
                    kendo.mobile.application.hideLoading();
                    app.mobileApp.navigate('#components/nota/view.html');
                },
                error: function (xhr, status, error) {
                    console.log(xhr);
                    console.log(status);
                    console.log(error);
                }
            });
        },
        onCloseModalCategoriaAdd: function (e) {
            $("#addCategoria").val("");
            $("input[name='inputCategoriasAdd']").each(function (index) {
                var id = $(this).attr("value");
                if ($(this).is(':checked')) {
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
                    $("#addTipo").val($("#addTipo").val() + $(this).parent().text() + "  ");
                }
            });
            closeModal('modalview-tipo-add');
        }

    }));

    parent.set('editItemViewModel', kendo.observable({
        onShow: function (e) {
            
            $("#li-modalview-categoria-edit").removeAttr("onclick");
            $("#li-modalview-tipo-edit").removeAttr("onclick");
            
            var item = e.view.params.uid;
            $("#btnEditNota").attr("name", item);
            var itemData;

            $.ajax({
                url: servidor + 'nota/obtenerPorId/' + item,
                type: 'GET',
                success: function (datos) {
                    itemData = datos;


                    // var itemUid = e.view.params.uid,
                    //     dataSource = notaModel.get('dataSource'),
                    //     itemData = dataSource.getByUid(itemUid);

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
                        var html = [];
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
                        $("#li-modalview-categoria-edit").attr("onclick","openModal('modalview-categoria-edit')");
                    });


                    //cargamos ds tipo 
                    var dsTipo = app.tipo.tipoModel.dataSource;
                    dsTipo.fetch(function () {
                        var html = [];
                        var data = dsTipo.data();
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
                        $("#li-modalview-tipo-edit").attr("onclick","openModal('modalview-tipo-edit')");
                    });


                    $("#editCategoria").val(categorias);
                    $("#editTipo").val(tipos);
                    $("#comentarioEdit").val(itemData.comentario);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log("Datos inválidos, Verifique sus datos de usuario y contraseña.");
                }
            });


        },
        onSaveClick: function () {
            var nota = {};
            var categoria = "";
            $("#editCategoria").removeClass("error");
            $("input[name='inputCategoriasEdit']").each(function (index) {
                var Id = $(this).attr("value");
                if ($(this).is(':checked')) {
                    if (categoria == "") {
                        categoria = Id;
                    } else {
                        categoria = categoria + "," + Id;
                    }

                }
            });
            if ($("#editCategoria").val() == "") {
                $("#editCategoria").addClass("error");
                return;
            }

            var tipo = "";
            $("#editTipo").removeClass("error");
            $("input[name='inputTiposEdit']").each(function (index) {
                var Id = $(this).attr("value");
                if ($(this).is(':checked')) {
                    if (tipo == "") {
                        tipo = Id;
                    } else {
                        tipo = tipo + "," + Id;
                    }
                }
            });
            if ($("#editTipo").val() == "") {
                $("#editTipo").addClass("error");
                return;
            }

            $("#comentarioEdit").removeClass("error");
            if ($("#comentarioEdit").val() == "") {
                $("#comentarioEdit").addClass("error");
                return;
            }


            $.ajax({
                url: servidor + "nota/actualizar?" + "id=" + $("#btnEditNota").attr("name") + "&comentario=" + $("#comentarioEdit").val() + "&fechaRegistro=" + "2016-06-10 11:11:11" + "&categorias=" + categoria + "&tipos=" + tipo + "&expositor_id=" + idExposicion + "&usuario_id=" + idUsuario,
                type: "PUT",
                beforeSend: function () {
                    kendo.mobile.application.showLoading();
                },
                success: function () {
                    kendo.mobile.application.hideLoading();
                    app.mobileApp.navigate('#:back');
                },
                error: function (xhr, status, error) {
                    kendo.mobile.application.hideLoading();
                    console.log(error);
                }
            });
        },
        onCloseModalCategoriaEdit: function (e) {
            $("#editCategoria").val("");
            $("input[name='inputCategoriasEdit']").each(function (index) {
                var id = $(this).attr("value");
                if ($(this).is(':checked')) {
                    $("#editCategoria").val($("#editCategoria").val() + $(this).parent().text() + "  ");
                }
            });
            closeModal('modalview-categoria-edit');
        },
        onCloseModalTipoEdit: function (e) {
            $("#editTipo").val("");
            $("input[name='inputTiposEdit']").each(function (index) {
                var id = $(this).attr("value");
                if ($(this).is(':checked')) {
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
        $.ajax({
            url: servidor + 'nota/obtenerPorExpositor?id=' + idExposicion + "&isPaged=0&take=50&skip=0&page=1&pageSize=50",
            type: 'GET',
            beforeSend: function () {
                kendo.mobile.application.showLoading();
            },
            success: function (datos) {
                kendo.mobile.application.hideLoading();
                if (datos) {
                    if (datos.length > 0) {
                        $('ul[data-template="notaModelTemplate"]').css("display", "block");
                        dataSource.transport.options.read.url = servidor + 'nota/obtenerPorExpositor?id=' + idExposicion + '&isPaged=0';
                        // var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null;
                        var param = null;
                        fetchFilteredData(param);
                    }
                } else {
                    $('ul[data-template="notaModelTemplate"]').css("display", "none");
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                kendo.mobile.application.hideLoading();
                console.log(thrownError);
                // alert("Datos inválidos, Verifique sus datos de usuario y contraseña.");
            }
        });
    });
})(app.nota);


function upload(fileToUpload) {
    kendo.mobile.application.showLoading();
    var apiKey = "jrqctqafgjfs4mws";
    var el = new Everlive(apiKey);
    var options = {
        fileName: 'myAudio.wav',
        mimeType: ' audio/wav'
    };
    el.files.upload(fileToUpload, options).then(function (r) {
            var uploadResultArray = JSON.parse(r.response).Result;
            var uploadedFileId = uploadResultArray[0].Id;
            var uploadedFileUri = uploadResultArray[0].Uri;
            uploadedFileUri = uploadedFileUri.replace("https", "http");
            var newArchive = {
                Name: "MyArchive",
                FileUri: uploadedFileUri,
                FileId: uploadedFileId
            };
            el.data("Archivos").create(newArchive, function (data) {
                var id = data.result.Id;
                var dsOptionsArchivos = {
                    type: 'everlive',
                    transport: {
                        typeName: 'Archivos',
                        read: {
                            headers: {
                                "X-Everlive-Filter": JSON.stringify({
                                    "Id": id
                                })
                            }
                        }
                    },
                    error: function (e) {
                        if (e.xhr) {
                            alert(JSON.stringify(e.xhr));
                        }
                    }
                };
                var dsArchivos = new kendo.data.DataSource(dsOptionsArchivos);

                dsArchivos.fetch(function () {
                    var dataItem = dsArchivos.get(id);
                    $("#rutaBackEnd").text(dataItem.FileUri);

                    //hacer relación 
                    var ruta = $("#rutaBackEnd").text();
                    $.ajax({
                        url: servidor + 'audio/agregar',
                        type: 'POST',
                        data: {
                            notaId: $("#btnAccionModalEliminar").attr("idDelete"),
                            audio: ruta
                        },
                        success: function (datos) {
                            getAudios();
                            kendo.mobile.application.hideLoading();
                        },
                        error: function (xhr, ajaxOptions, thrownError) {
                            console.log(xhr);
                            console.log(thrownError);
                        }
                    });
                });

            }, function (err) {
                $("#rutaBackEnd").text("Error al subir el archivo al backend service " + JSON.stringify(err));
            });
        },
        function (uploadError) {
            $("#rutaBackEnd").text(JSON.stringify(uploadError));
        });
}

// function playAudio(url) {
//     var my_media = new Media(url,
//         // success callback
//         function () {
//             console.log("playAudio():Audio Success");
//         },
//         // error callback
//         function (err) {
//             console.log("playAudio():Audio Error: " + err);
//         }
//     );
//     // Play audio
//     my_media.play();
// }

// on a global level
var isAudioPlaying = false;
var isAudioPause = 0;
var mediaContent = null;
// function play button
function playAudio(url) {
    var src = url;
    if (isAudioPlaying) {
        mediaContent.stop();
    }
    mediaContent = new Media(src,
        function () {
            console.log("Media success"); // the media has been finished , set the flag to false, or handle any UI changes. 
        },
        function () {
            console.log("Media error");
        },
        function () {
            //console.log("Media change");
        });

    mediaContent.play();
    isAudioPlaying = true;
    isAudioPause = url;
}

function getAudios() {
    $.ajax({
        url: servidor + 'audio/listarPorNota/' + $("#btnAccionModalEliminar").attr("idDelete"),
        type: 'GET',
        success: function (data) {
            $(".media").html("");
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    var onclick = 'onclick="playAudio(' + "'" + data[i].audio + "'" + ');"';
                    if (i == data.length - 1) {
                        $(".media").append('<span class="primero" onclick="openModalDelete(' + data[i].id + ');" style="border-bottom: solid 1px #99C023"><span class="glyph-icon flaticon-paper-bin"></span></span><div class="segundo" style="border-bottom: solid 1px #99C023;"><span class="glyph-icon flaticon-music"></span>Audio: ' + data[i].id + '</div><div class="tercero" ' + onclick + ' style="border-bottom: solid 1px #99C023;"><span class="glyph-icon flaticon-play-button"></span></div>');
                    } else {
                        $(".media").append('<span class="primero" onclick="openModalDelete(' + data[i].id + ');" ><span class="glyph-icon flaticon-paper-bin"></span></span><div class="segundo"><span class="glyph-icon flaticon-music"></span>Audio: ' + data[i].id + '</div><div class="tercero" ' + onclick + ' ><span class="glyph-icon flaticon-play-button"></span></div>');
                    }

                }
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr);
            console.log(thrownError);
        }
    });
}

function openModalDelete(id) {
    $("#contentDeleteAudio").html("Desea eliminar el audio: " + id);
    $("#btnDeleteAudio").attr("onclick", "deleteAudio(" + id + ")");
    openModal("modalview-eliminar-audio");
}

function deleteAudio(id) {
    closeModal("modalview-eliminar-audio");
    $.ajax({
        url: servidor + 'audio/eliminar/' + id,
        type: 'DELETE',
        beforeSend: function () {
            kendo.mobile.application.showLoading();
        },
        success: function () {
            console.log("eliminado");
            getAudios();
            kendo.mobile.application.hideLoading();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            kendo.mobile.application.hideLoading();
            console.log(xhr);
            console.log(thrownError);
            // alert("Datos inválidos, Verifique sus datos de usuario y contraseña.");
        }
    });
}