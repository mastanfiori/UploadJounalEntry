/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device"
	], function (JSONModel, Device) {
		"use strict";

		return {

			createDeviceModel : function () {
				var oModel = new JSONModel(Device);
				oModel.setDefaultBindingMode("OneWay");
				return oModel;
			},

			createFLPModel : function () {
				var fnGetUser = jQuery.sap.getObject("sap.ushell.Container.getUser"),
					bIsShareInJamActive = fnGetUser ? fnGetUser().isJamActive() : false,
					oModel = new JSONModel({
						isShareInJamActive: bIsShareInJamActive
					});
				oModel.setDefaultBindingMode("OneWay");
				return oModel;
			},
			
			createUIModel: function() {
				var oModel = new JSONModel({
					BatchID: undefined,
					submitBtnEnabled: false,
					postBtnEnabled: false
				});
				return oModel;
			},
			
			createMessageModel: function() {
            	var oModel = new JSONModel({
            		ErrorMessagesList: undefined,
            		MessageNum: undefined,
            		OnlyHaveWarning: undefined,
            		/* StatusCode:
            		   "0": UploadAllFailed, "1": UploadPartialFailed
            		   "2": UploadAllSuccessfulButHaveWarning,
            		   "3": PostWithBatchIDHaveError, 
            		   "4" PostWithHeldDocGUIDHaveError*/
            		StatusCode: undefined 
            	});
        		return oModel;
			}

		};

	}
);