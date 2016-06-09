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
            if (!data.email) {
                alert('Missing email');
                return false;
            }

            if (!data.password) {
                alert('Missing password');
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

            kendo.mobile.application.showLoading();
            $.ajax({
                url: servidor + 'authenticate',
                type: 'POST',
                dataType: 'json',

                beforeSend: function (xhr) {
                    xhr.setRequestHeader(
                        'Authorization',
                        'Basic ' + btoa(email + ":" + password));
                },
                complete: function (datos) {
                    var data = JSON.parse(datos.responseText);
                    token = data.token;
                    console.log(token);
                    kendo.mobile.application.hideLoading();
                    app.mobileApp.navigate('components/home/registro.html');
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    kendo.mobile.application.hideLoading();
                    // console.log("Connection error: " + xhr.responseText);
                    // console.log("Connection error: " + thrownError);
                    alert("Datos inválidos, Verifique sus datos de usuario y contraseña.");
                }
            });
        },
        register: function () {
            var model = homeModel,
                email = model.email.toLowerCase(),
                password = model.password,
                displayName = model.displayName,
                attrs = {
                    Email: email,
                    DisplayName: displayName
                };

            if (!model.validateData(model)) {
                return false;
            }

            provider.Users.register(email, password, attrs, successHandler, init);
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

// START_CUSTOM_CODE_homeModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_homeModel



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