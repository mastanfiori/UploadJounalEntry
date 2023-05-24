/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/thirdparty/bignumber"
	] , function (DateFormat, BigNumber) {
		"use strict";

		return {
			
			mediumStyleDateTime: function(date) {
            	if (date && Object.prototype.toString.call(date) === Object.prototype.toString.call(new Date())) {
                	var oDateFormat = DateFormat.getDateTimeInstance({style: "medium"});
                	return oDateFormat.format(date);
            	}
            	return "";
        	},
        	
        	mediumStyleDate: function(date) {
            	if (date && Object.prototype.toString.call(date) === Object.prototype.toString.call(new Date())) {
                	var oDateFormat = DateFormat.getDateInstance({style: "medium"});
                	return oDateFormat.format(date);
            	}
            	return "";
        	},

			/**
			 * Rounds the number unit value to 2 digits
			 * @public
			 * @param {string} sValue the number string to be rounded
			 * @returns {string} sValue with 2 digits rounded
			 */
			numberUnit : function (sValue) {
				if (!sValue) {
					return "";
				}
				return new BigNumber(sValue).toFixed(2);
			},
			
	        /**
	         * 
	         */
	    	formatParkedDocumentStatus : function (sStatus) {
	    		if (sStatus === "S") {
	    			return "Success";
	    		} else if(sStatus === "H" || sStatus === "P") {
	    			return "None";
	    		}
	    		return "Error";
	    	}
		};

	}
);