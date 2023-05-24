/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/generic/app/navigation/service/NavigationHandler"
	], function (Controller, NavigationHandler) {
		"use strict";

		return Controller.extend("fin.gl.journalentry.upload.controller.BaseController", {
			onInit: function() {
            	this.oNavigationHandler = new NavigationHandler(this);
            	this.oRouter = this.getRouter();
			},
			
			/**
			 * Convenience method for accessing the router.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter : function () {
				return sap.ui.core.UIComponent.getRouterFor(this);
			},

			/**
			 * Convenience method for getting the view model by name.
			 * @public
			 * @param {string} [sName] the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel : function (sName) {
				return this.getView().getModel(sName);
			},

			/**
			 * Convenience method for setting the view model.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.mvc.View} the view instance
			 */
			setModel : function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			/**
			 * Getter for the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle : function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},

			/**
			 * Event handler when the share by E-Mail button has been clicked
			 * @public
			 */
			/*onShareEmailPress : function () {
				var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
				sap.m.URLHelper.triggerEmail(
					null,
					oViewModel.getProperty("/shareSendEmailSubject"),
					oViewModel.getProperty("/shareSendEmailMessage")
				);
			},*/
			
			storeCurrentAppState: function(oCustomData) {
        		var oAppStatePromise = this.oNavigationHandler.storeInnerAppState(oCustomData);
            	oAppStatePromise.fail(function(oError) {
                	this._handleError(oError);
            	}.bind(this));

            	return oAppStatePromise;
        	},

        	retrieveAppState: function() {
            	var oAppStatePromise = this.oNavigationHandler.parseNavigation();
            	oAppStatePromise.fail(function(oError) {
                	this._handleError(oError);
            	}.bind(this));

            	return oAppStatePromise;
        	},
        	
        	_handleError: function (oError) {
        	},
        	
        	getWorkflowStatus: function() {
        		var that = this;
	            this.getOwnerComponent().getModel().callFunction("/IsWorkflowActive", {
                    method: "GET",
                    success: function(oResponse) {
                    	that.getModel("appView").setProperty("/workflowActive", oResponse.IsWorkflowActive.IsActive);
                    },
                    error: function(oError) {
                        jQuery.sap.log.error(oError);
                    }
                });
            }
		});

	}
);