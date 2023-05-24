/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/base/Object",
		"sap/m/MessageBox"
	], function (UI5Object, MessageBox) {
		"use strict";

		return UI5Object.extend("fin.gl.journalentry.upload.controller.ErrorHandler", {

			/**
			 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
			 * @class
			 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
			 * @public
			 * @alias fin.gl.journalentry.upload.controller.ErrorHandler
			 */
			constructor : function (oComponent) {
				this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
				this._oComponent = oComponent;
				this._oModel = oComponent.getModel();
				this._bMessageOpen = false;
				this._sErrorText = this._oResourceBundle.getText("errorText");

				this._oModel.attachMetadataFailed(function (oEvent) {
					var oParams = oEvent.getParameters();
					this._showServiceError(oParams.response);
				}, this);

				this._oModel.attachRequestFailed(function (oEvent) {
					var oParams = oEvent.getParameters();
					this._handleRequestFailed(oParams);
				}, this);
			},
			
			/**
			 * Handle request failed.
			 */
			_handleRequestFailed: function(oParams){
				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf("Cannot POST") === 0)) {
					try {
						var oResponseObject = jQuery.parseJSON(oParams.response.responseText);
						if (oResponseObject.error && oResponseObject.error.code === "FINS_ACDOC_POST/100") {
							if (oResponseObject.error.innererror && oResponseObject.error.innererror.errordetails) {
								var aErrorDetails = oResponseObject.error.innererror.errordetails;
								var sNoHoldMsg, sLockedMsg;
								for (var i = 0; i < aErrorDetails.length; i++) {
									if (aErrorDetails[i].code === "FDC_POSTING_001/033") {
										sNoHoldMsg = aErrorDetails[i].message;
									}
									if (aErrorDetails[i].code === "FDC_POSTING_001/013") {
										sLockedMsg =  aErrorDetails[i].message;
									}
								}
								if (sLockedMsg) {
									this._sErrorText = sLockedMsg;
								} else if (sNoHoldMsg) {
									this._sErrorText = sNoHoldMsg;
								}
							}
						}
					} catch(exception) {
						
					}
					this._showServiceError(oParams.response);
				}
			},

			/**
			 * Shows a {@link sap.m.MessageBox} when a service call has failed.
			 * Only the first error message will be display.
			 * @param {string} sDetails a technical error to be displayed on request
			 * @private
			 */
			_showServiceError : function (sDetails) {
				if (this._bMessageOpen) {
					return;
				}
				this._bMessageOpen = true;
				MessageBox.error(
					this._sErrorText,
					{
						id : "serviceErrorMessageBox",
						details: sDetails,
						styleClass: this._oComponent.getContentDensityClass(),
						actions: [MessageBox.Action.CLOSE],
						onClose: function () {
							this._bMessageOpen = false;
						}.bind(this)
					}
				);
			}
		});
	}
);