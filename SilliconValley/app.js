'use strict';
// var servidor = "http://localhost:8080/silliconvalley/";
// var servidor = "http://192.168.1.201:8080/silliconvalley/";
var servidor = "http://190.237.15.180:201/silliconvalley/";
var idUsuario = "";
var idExposicion = "";
(function () {
    var app = {
        data: {}
    };

    var bootstrap = function () {
        $(function () {
            app.mobileApp = new kendo.mobile.Application(document.body, {
                skin: 'nova',
                initial: 'components/home/view.html'
            });
        });
    };

    if (window.cordova) {
        document.addEventListener('deviceready', function () {
            if (navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
            }

            var element = document.getElementById('appDrawer');
            if (typeof (element) != 'undefined' && element !== null) {
                if (window.navigator.msPointerEnabled) {
                    $('#navigation-container').on('MSPointerDown', 'a', function (event) {
                        app.keepActiveState($(this));
                    });
                } else {
                    $('#navigation-container').on('touchstart', 'a', function (event) {
                        app.keepActiveState($(this).closest('li'));
                    });
                }
            }

            bootstrap();
        }, false);
    } else {
        bootstrap();
    }

    app.keepActiveState = function _keepActiveState(item) {
        var currentItem = item;
        $('#navigation-container li.active').removeClass('active');
        currentItem.addClass('active');
    };

    window.app = app;

    app.isOnline = function () {
        if (!navigator || !navigator.connection) {
            return true;
        } else {
            return navigator.connection.type !== 'none';
        }
    };
}());

// START_CUSTOM_CODE_kendoUiMobileApp
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_kendoUiMobileApp




function closeModal(modal) {
    $("#" + modal).kendoMobileModalView("close");
}

function openModal(modal) {
    var mv = $("#" + modal).data("kendoMobileModalView");
    mv.shim.popup.options.animation.open.effects = "zoom";
    mv.open();
}

function cerrarSesion() {
    $("#liInicio").css("display", "block");
    $("#liCerrarSesion").css("display", "none");
    $("#liExposiciones").css("border-bottom", "solid 1px #017678");
}