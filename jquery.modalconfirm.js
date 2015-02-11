/*
 ModalConfirm popup modal confirmation-dialog
 Version 1.1

 Copyright (C) 2014-2015 Tom Phane
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
	 overlayID: ID of div representing the background-overlay, default 'mc_overlay'
	 popupID: ID of div representing the dialog, default null (in which case,
		the dialog div is assumed to be the first child of the overlayID div)
	 confirmBtnID: ID of confirm/agree/yes button inside the dialog div, default 'mc_conf'
	 denyBtnID: ID of deny/refuse/no button inside the dialog div, default 'mc_deny'
	 doCheck: function for click-time check whether to show the dialog, default null
	 preShow: function to tailor the dialog prior to showing it, default null
	 onCheckFail: either a function (which returns true/false) to call if doCheck
		returns false, and then return the value returned from that function,
		or else just boolean true or false, in which cases call the corresponding
		onConfirm/onDeny if it exists, and then return the boolean value
		default null
	 onConfirm: function to call if confirmBtnID button is clicked, default null
	 onDeny: function to call if denyBtnID button is clicked, default null
      whether or not present, the original event will be aborted

 API
 context/this = object to which the dialog was bound
 doCheck()
 preShow(div)
   div = the popupID div 
 onCheckFail()
 onConfirm()
 onDeny()

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
	position: absolute;
	top:50%;
	left:50%;
	z-index:1002;
	OTHERS AS APPROPRIATE

 @type jQuery

 @name modalconfirm

 @cat Plugins/ModalConfirm

 @author Tom Phane
*/

(function ($) {
	//merge class into jQuery namespace
	$.extend({
		modalconfirm: new function () {
			this.defaults = {
				confirmBtnID: 'mc_conf',
				denyBtnID: 'mc_deny',
				doCheck: null,
				onCheckFail: null,
				onConfirm: null,
				onDeny: null,
				overlayID: 'mc_overlay',
				popupID: null,
				preShow: null
			};

			this.construct = function (options) {
				//merge parameters
				var settings = $.extend({}, $.modalconfirm.defaults, options || {});
				this.each(function () {
					$(this).bind('click.mc_confirm',settings,clickhandler);
				});
				return this;
			};

			function clickhandler (ef) {
				var settings = ef.data;
				var ob = ef.target;
				if(!$.isFunction(settings.doCheck) || settings.doCheck.call()) {
					ef.stopImmediatePropagation();
					ef.preventDefault();
					var overlay = $('#'+settings.overlayID);
					overlay.css({ 'display':'block' });
					var popup = (settings.popupID) ?
						$('#'+settings.popupID) : overlay.children(':first');
					popup.find('#'+settings.confirmBtnID).click(function(eb) {
						eb.stopImmediatePropagation();
						hide(overlay,popup);
						var conf;
						if($.isFunction(settings.onConfirm)) {
							conf = settings.onConfirm.call(ob);
						} else {
							conf = (settings.onConfirm === null || settings.onConfirm !== false);
						}
						if(conf) {
							$(ob).unbind('click.mc_confirm').trigger('click'); //prevent re-entrance
							$(ob).bind('click.mc_confirm',settings,clickhandler);
						}
					});
					popup.find('#'+settings.denyBtnID).click(function(eb) {
						eb.stopImmediatePropagation();
						hide(overlay,popup);
						$.isFunction(settings.onDeny) && settings.onDeny.call(ob);
					});

					if($.isFunction(settings.preShow)) {
						settings.preShow.call(ob,popup);
					}
					var high = popup.height();
					var wide = popup.width();
					var vadj = -popup.outerHeight()/2;
					var hadj = -popup.outerWidth()/2;

					popup.css({
						'margin-top' : vadj + 'px',
						'margin-left' : hadj + 'px',
						'height' :  high + 'px',
						'width' :  wide + 'px',
						'display':'block'
					});
				} else if(settings.onCheckFail) {
					var stop;
					if($.isFunction(settings.onCheckFail)) {
						stop = !settings.onCheckFail.call(ob);
					} else if($.isFunction(settings.onConfirm)) {
						stop = !settings.onConfirm.call(ob);
					} else {
						stop = (settings.onConfirm === false);
					}
					if (stop) {
						ef.stopImmediatePropagation();
						ef.preventDefault();
					}
				} else if($.isFunction(settings.onDeny)) {
					settings.onDeny.call(ob);
				}
			}

			function hide (overlay,popup) {
				popup.css({'display':'none'});
				overlay.css({'display':'none'});
			}
		}
	});
	//merge object into jQuery prototype
	$.fn.extend({ modalconfirm: $.modalconfirm.construct });
})(jQuery);
