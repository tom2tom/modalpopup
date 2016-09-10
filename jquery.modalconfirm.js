/*!
ModalConfirm popup modal confirmation-dialog
Version 2.3
Copyright (C) 2014-2016 Tom Phane
Licensed under the GNU Affero GPL license v.3, or at the distributor's discretion, a later version
*/
/**
 @description
 Popup modal confirmation-dialog

 @example $('#submit').modalconfirm();
 @desc when object with id 'submit' is clicked, pop up dialog using default options.

 @example $('.table').modalconfirm({settings});
 @desc when object with class 'table' is clicked, pop up dialog with specified
  options overriding corresponding defaults.
 @param settings An object literal containing one or more key:value pairs
	Settings options -
	 event: name of bound event, default 'click'
	 overlayID: ID of div representing the background-overlay, default 'mc_overlay'
	 popupID: ID of div representing the dialog, default null (in which case,
		the dialog div is assumed to be the first child of the overlayID div)
	 seeButtons: which button(s) to show - 'both' or 'confirm' or 'deny', default 'both'
	 confirmBtnID: ID of confirm/agree/yes button to be displayed inside the
		dialog div, default 'mc_conf'
	 denyBtnID: ID of deny/refuse/no button to be displayed inside the dialog div,
		default 'mc_deny'
	 doCheck: function for event-time check whether to show the dialog, default null
	 preShow: function to tailor the dialog prior to showing it, default null
	 onCheckFail: either a function (which returns true/false), or just boolean true
	 	or false, default null. Relevant if doCheck returns false - false aborts the
	 	original event
	 onConfirm: function to call if confirmBtnID button is clicked, default null
	 onDeny: function to call if denyBtnID button is clicked, default null
     	  whether or not present, the original event will be aborted
	 showTarget: DOM object treated as the bound object and event.target, during a
	 'show' method call, default null

 @example $.modalconfirm.show({settings});
 @desc programatically pop up a dialog
 @param settings ibid, must include a showTarget if the event is to be triggered
  automatically after confirmation
 API
 context/this = object to which the dialog was bound
 tg = bound-event.currentTarget object
 $popup = popup container-div object
 doCheck() return T/F, T shows dialog
 preShow(tg,$popup) return nothing
 onCheckFail(tg) return T/F, F aborts
 onConfirm(tg,$popup) return T/F, F aborts
 onDeny(tg) return nothing

 Related css:
 for overlay div:
	display:none;
	position:fixed;
	top:0;
	left:0;
	height:100%;
	width:100%;
	z-index:1001;
	background-color:rgba(0,0,0,.3); //or whatever
 for dialog div:
	display:none;
	position:fixed;
	top:50%;
	left:50%;
	z-index:1002;
	OTHERS AS APPROPRIATE

 @type jQuery

 @name modalconfirm

 @cat Plugins/ModalConfirm

 @author Tom Phane
*/

(function($) { "$:nomunge";
    //merge class into jQuery namespace
    $.extend({
        modalconfirm: new function() {
            this.defaults = {
                event: 'click',
                confirmBtnID: 'mc_conf',
                denyBtnID: 'mc_deny',
                doCheck: null,
                onCheckFail: null,
                onConfirm: null,
                onDeny: null,
                overlayID: 'mc_overlay',
                popupID: null,
                preShow: null,
                seeButtons: 'both',
                showTarget: null
            };

            this.construct = function(options) {
                //merge parameters
                var settings = $.extend({}, $.modalconfirm.defaults, options || {}, {confirmCss: null, denyCss: null});
                this.each(function() {
                    $(this).bind(settings.event, settings, eventhandler);
                });
                return this;
            };

            //target bound-event handler
            function eventhandler(ef) {
                var settings = ef.data,
                    tg = ef.currentTarget;
                if (!$.isFunction(settings.doCheck) || settings.doCheck.call(this)) {
                    ef.stopImmediatePropagation();
                    ef.preventDefault();
                    var $overlay = $('#' + settings.overlayID),
                        $popup = (settings.popupID) ?
                        $('#' + settings.popupID) : $overlay.children(':first');
                    var $btn = $popup.find('#' + settings.confirmBtnID);
                    if (settings.seeButtons != 'deny') {
                        //confirm-button click handler
                        $btn.click(function(eb) {
                            eb.stopImmediatePropagation();
                            hide($overlay, $popup, settings);
                            var conf;
                            if ($.isFunction(settings.onConfirm)) {
                                conf = settings.onConfirm.call(this, tg, $popup);
                            } else {
                                conf = (settings.onConfirm === null || settings.onConfirm !== false);
                            }
                            if (conf) {
                                var $tg = $(tg);
                                $tg.unbind(settings.event, eventhandler); //prevent re-entrance
                                $(ef.target).trigger(settings.event); //start again from source
                                $tg.bind(settings.event, settings, eventhandler);
                            }
                        });
                    } else {
                        //cache current display setting, for later reinstate
                        if ('display' in $btn[0].style) {
                            settings.confirmCss = $btn[0].style.display;
                        } else {
                            settings.confirmCss = '';
                        }
                        $btn[0].style.display = 'none';
                    }
                    $btn = $popup.find('#' + settings.denyBtnID);
                    if (settings.seeButtons != 'confirm') {
                        //deny-button click handler
                        $btn.click(function(eb) {
                            eb.stopImmediatePropagation();
                            eb.preventDefault();
                            hide($overlay, $popup, settings);
                            $.isFunction(settings.onDeny) && settings.onDeny.call(this, tg);
                        });
                    } else {
                        if ('display' in $btn[0].style) {
                            settings.denyCss = $btn[0].style.display;
                        } else {
                            settings.denyCss = '';
                        }
                        $btn[0].style.display = 'none';
                    }
                    //setup the popup
                    $.isFunction(settings.preShow) && settings.preShow.call(this, tg, $popup);
                    $overlay.css('display', 'block'); //1st, to get popup sizes right
                    var vadj = -$popup.outerHeight() / 2;
                    var hadj = -$popup.outerWidth() / 2;
                    $popup.css({
                        'margin-top': vadj + 'px',
                        'margin-left': hadj + 'px',
                        'position': 'fixed',
                        'display': 'block'
                    });
                } else {
                    //check failed, no popup
                    var stop;
                    if (settings.onCheckFail) {
                        if ($.isFunction(settings.onCheckFail)) {
                            stop = !settings.onCheckFail.call(this, tg);
                        } else {
                            stop = (settings.onCheckFail === false);
                        }
                    } else {
                        stop = true;
                    }
                    if (stop) {
                        $.isFunction(settings.onDeny) && settings.onDeny.call(this, tg);
                        ef.stopImmediatePropagation();
                        ef.preventDefault();
                    }
                }
            }

            function hide($overlay, $popup, settings) {
                $popup.css({ 'display': 'none' });
                $overlay.css({ 'display': 'none' });
                $popup.find('#' + settings.confirmBtnID)[0].style.display = settings.confirmCss;
                settings.confirmCss = null;
                $popup.find('#' + settings.denyBtnID)[0].style.display = settings.denyCss;
                settings.denyCss = null;
            }

            this.show = function(options) {
                var settings = $.extend({}, $.modalconfirm.defaults, options || {}, {confirmCss: null, denyCss: null}),
                    $overlay = $('#' + settings.overlayID),
                    $popup = (settings.popupID) ?
                    $('#' + settings.popupID) : $overlay.children(':first'),
                    $btn = $popup.find('#' + settings.confirmBtnID);
                if (settings.seeButtons != 'deny') {
                    //confirm-button click handler
                    $btn.click(function(eb) {
                        eb.stopImmediatePropagation();
                        hide($overlay, $popup, settings);
                        var conf,
                            tg = settings.showTarget;
                        if ($.isFunction(settings.onConfirm)) {
                            conf = settings.onConfirm.call(this, tg, $popup);
                        } else {
                            conf = (settings.onConfirm === null || settings.onConfirm !== false);
                        }
                        if (conf && tg) {
                            $(tg).trigger(settings.event);
                        }
                    });
                } else {
                    //cache current display setting, for later reinstate
                    if ('display' in $btn[0].style) {
                        settings.confirmCss = $btn[0].style.display;
                    } else {
                        settings.confirmCss = '';
                    }
                    $btn[0].style.display = 'none';
                }
                $btn = $popup.find('#' + settings.denyBtnID);
                if (settings.seeButtons != 'confirm') {
                    //deny-button click handler
                    $btn.click(function(eb) {
                        eb.stopImmediatePropagation();
                        eb.preventDefault();
                        hide($overlay, $popup, settings);
                        $.isFunction(settings.onDeny) && settings.onDeny.call(this, settings.showTarget);
                    });
                } else {
                    if ('display' in $btn[0].style) {
                        settings.denyCss = $btn[0].style.display;
                    } else {
                        settings.denyCss = '';
                    }
                    $btn[0].style.display = 'none';
                }
                //setup the popup
                $.isFunction(settings.preShow) && settings.preShow.call(this, settings.showTarget, $popup);
                $overlay.css('display', 'block'); //1st, to get popup sizes right
                var high = $popup.height();
                var wide = $popup.width();
                var vadj = -$popup.outerHeight() / 2;
                var hadj = -$popup.outerWidth() / 2;
                $popup.css({
                    'margin-top': vadj + 'px',
                    'margin-left': hadj + 'px',
                    'height': high + 'px',
                    'width': wide + 'px',
                    'position': 'fixed',
                    'display': 'block'
                });
            };
        }
    });
    //merge object into jQuery prototype
    $.fn.extend({ modalconfirm: $.modalconfirm.construct });
})(jQuery);
