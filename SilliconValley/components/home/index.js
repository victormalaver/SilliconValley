'use strict';

app.home = kendo.observable({
    onShow: function () {},
    afterShow: function () {}
});
// START_CUSTOM_CODE_home
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_home
(function (parent) {
    var homeModel = kendo.observable({
        displayName: '',
        email: '',
        password: '',
        validateData: function (data) {
            $("#emailLogin, #passLogin").parent().removeClass("error");

            var testEmail = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
            if (testEmail.test($("#emailLogin").val())) {
                $("#emailLogin").parent().removeClass("error");
            } else {
                $("#emailLogin").parent().addClass("error");
                return false;
            }

            if (!data.email) {
                $("#emailLogin").parent().addClass("error");
                return false;
            }

            if (!data.password) {
                $("#passLogin").parent().addClass("error");
                return false;
            }

            return true;
        },
        signin: function () {
            var model = homeModel,
                email = model.email.toLowerCase(),
                password = model.password;

            if (!model.validateData(model)) {
                return false;
            }
            // provider.Users.login(email, password, successHandler, init);
            $.ajax({
                url: servidor + 'authenticate',
                type: 'POST',
                dataType: 'json',
                beforeSend: function (xhr) {
                    kendo.mobile.application.showLoading();
                    xhr.setRequestHeader(
                        'Authorization',
                        'Basic ' + btoa(email + ":" + password));
                },
                complete: function (datos) {
                    $("#emailLogin, #passLogin").parent().removeClass("error");
                    switch (datos.status) {
                        case 401:
                            // No autorizado
                            $("#contentAlertHome").html("Ingrese la contraseña correcta");
                            $("#passLogin").parent().addClass("error");
                            openModal('modalview-alert-home');
                            return false;
                            break;
                        case 404:
                            // No encontrado
                            $("#contentAlertHome").html("Usuario no registrado");
                            $("#emailLogin").parent().addClass("error");
                            openModal('modalview-alert-home');
                            return false;
                            break;
                        default:
                            break;
                    }
                    var data = JSON.parse(datos.responseText);
                    idUsuario = data.idUsuario;
                    kendo.mobile.application.hideLoading();
                    app.mobileApp.navigate('components/expocision/view.html');
                    $("#liInicio").css("display", "none");
                    $("#liCerrarSesion").css("display", "block");
                    $("#liExposiciones").css("border-bottom", "");
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    kendo.mobile.application.hideLoading();
                    // $("#emailLogin, #passLogin").parent().addClass("error");
                    // app.mobileApp.navigate('components/home/registro.html');
                }
            });
        },
        register: function () {
            var model = homeModel;
            $("#correoUsuario, #pass1, #pass2,#nombreUsuario").parent().removeClass("error");

            var testEmail = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
            if (testEmail.test($("#correoUsuario").val())) {
                $("#correoUsuario").parent().removeClass("error");
            } else {
                $("#correoUsuario").parent().addClass("error");
                return;
            }

            if ($("#pass1").val() == "") {
                $("#pass1").parent().addClass("error");
                return;
            }
            if ($("#pass2").val() == "") {
                $("#pass2").parent().addClass("error");
                return;
            }
            if ($("#nombreUsuario").val() == "") {
                $("#nombreUsuario").parent().addClass("error");
                return;
            }
            if ($("#pass1").val() !== $("#pass2").val()) {
                $("#pass1,#pass2").parent().addClass("error");
                return;
            }

            $.ajax({
                url: servidor + 'usuario/agregar',
                type: 'POST',
                data: {
                    nombre: $("#nombreUsuario").val(),
                    empresa: "Empresa",
                    fechaNacimiento: "2016-01-01 11:11:11",
                    sexo: "m",
                    contrasena: $("#pass1").val(),
                    correo: $("#correoUsuario").val(),
                    cargo: "Cargo"
                },
                beforeSend: function (xhr) {
                    kendo.mobile.application.showLoading();
                },
                complete: function (datos) {
                    kendo.mobile.application.hideLoading();
                    if (datos.status !== 200) {
                        $("#contentAlertHome").html("Usuario ya registrado");
                        $("#correoUsuario").parent().addClass("error");
                        openModal('modalview-alert-home');
                        return false;
                    } else {
                        $("#correoUsuario").parent().removeClass("error");
                        idUsuario = datos.responseText;

                        app.mobileApp.navigate('components/expocision/view.html');
                        $("#liInicio").css("display", "none");
                        $("#liCerrarSesion").css("display", "block");
                        $("#liExposiciones").css("border-bottom", "");
                    }
                },
                error: function (xhr) {
                    kendo.mobile.application.hideLoading();
                    return;
                }
            });
        },
        goToRegistro: function () {
            app.mobileApp.navigate('components/home/registro.html');
        },
        goToView: function () {
            app.mobileApp.navigate('components/home/view.html');
        }
    });

    parent.set('homeModel', homeModel);
})(app.home);



function onCloseModalCategoria(e) {
    $("#categoria").val();
    $("input[name='inputCategorias']").each(function (index) {
        var id = $(this).attr("value");
        // console.log(id);
        if ($(this).is(':checked')) {
            // console.log($(this).parent().text());
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
            // console.log($(this).parent().text());
            $("#tipo").val($("#tipo").val() + $(this).parent().text() + "  ");
        }
    });
}