/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["fin/gl/journalentry/upload/util/Constants"], function(Constants) {
    "use strict";
    return {
        formatStringAlphaConversion: function(str, len){
            var string = String(str);
            var dif = len - string.length;
            if (isNaN(str)){
                  //Is not numeric => fill with trailing spaces
                  if(dif <= 0){
                        return string;
                  }else {
                        while (string.length < len){
                             string = string+ Constants.BLANK;
                        }
                        return string;
                  }
            }else {
                  //Is numeric => fill with leading zeros
                  if(dif <= 0){
                        return string;
                  }else {
                        while (string.length < len){
                             string = Constants.ZERO + string;
                        }
                        return string;
                  } 
            }
        },
    	
    	paddingLeft: function(sString, sPadChar, iLength) {
    	  if (!sString || !sPadChar || sString.length >= iLength) {
    	    return sString;
    	  }
    	  var max = (iLength - sString.length)/sPadChar.length;
    	  for (var i = 0; i < max; i++) {
    		  sString = sPadChar + sString;
    	  }
    	  return sString;
    	},
    	 
    	paddingRight: function(sString, sPadChar, iLength) {
    	  if (!sString || !sPadChar || sString.length >= iLength) {
    	    return sString;
    	  }
    	  var max = (iLength - sString.length)/sPadChar.length;
    	  for (var i = 0; i < max; i++) {
			  sString += sPadChar;
    	  }
    	  return sString;
    	},
    	
    	assembleDocumentTmpId: function(sCompanyCode, sAccountingDocument, sFiscalYear) {
            sCompanyCode =  this.paddingRight(sCompanyCode, Constants.BLANK, 4);
            sAccountingDocument = this.formatStringAlphaConversion(sAccountingDocument, 10);
            sFiscalYear = this.formatStringAlphaConversion(sFiscalYear, 4);
            return Constants.PARKED_TYPE + sCompanyCode + sAccountingDocument + sFiscalYear;
    	},
		
		displayMessage: function(oMessage, fnCallback, aIgnoreLevel) {
			// initilize the array when value is undefined or aIgnoreLevel isn't array
			if(!(aIgnoreLevel && Array.isArray(aIgnoreLevel))) {
				aIgnoreLevel = [];
			}
			
         	if(aIgnoreLevel.indexOf(oMessage.severity) > -1 ) {
         		fnCallback();
         	} else {
				if(oMessage) {
					switch(oMessage.severity) {
					case "info":
						sap.m.MessageBox.information(oMessage.message, {onClose: fnCallback});
						break;
					case "warning":
						sap.m.MessageBox.warning(oMessage.message, {onClose: fnCallback});
						break;
					case "error":
						sap.m.MessageBox.error(oMessage.message, {onClose: fnCallback});
						break;
					}
				}
         	}
		}
    };
});