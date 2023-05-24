/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"fin/gl/journalentry/upload/controller/BaseController",
		"sap/ui/model/json/JSONModel"
	], function (BaseController, JSONModel) {
		"use strict";

		return BaseController.extend("fin.gl.journalentry.upload.controller.App", {

			onInit : function () {
				var oViewModel,
					fnSetAppNotBusy,
					iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
				
				// current logon language
				var sLanguage = sap.ui.getCore().getConfiguration().getSAPLogonLanguage();
				oViewModel = new JSONModel({
					busy : true,
					delay : 0,
					language : sLanguage,
					workflowActive : false
				});
				this.setModel(oViewModel, "appView");
				this.getWorkflowStatus();

				fnSetAppNotBusy = function() {
					oViewModel.setProperty("/busy", false);
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				};

				this.getOwnerComponent().getModel().metadataLoaded().
					then(fnSetAppNotBusy);

				// apply content density mode to root view
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}
		});

	}
);