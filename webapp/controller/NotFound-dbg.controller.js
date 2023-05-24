/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"fin/gl/journalentry/upload/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("fin.gl.journalentry.upload.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("upload");
			}

		});

	}
);