/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/format/DateFormat","sap/ui/thirdparty/bignumber"],function(D,B){"use strict";return{mediumStyleDateTime:function(d){if(d&&Object.prototype.toString.call(d)===Object.prototype.toString.call(new Date())){var o=D.getDateTimeInstance({style:"medium"});return o.format(d);}return"";},mediumStyleDate:function(d){if(d&&Object.prototype.toString.call(d)===Object.prototype.toString.call(new Date())){var o=D.getDateInstance({style:"medium"});return o.format(d);}return"";},numberUnit:function(v){if(!v){return"";}return new B(v).toFixed(2);},formatParkedDocumentStatus:function(s){if(s==="S"){return"Success";}else if(s==="H"||s==="P"){return"None";}return"Error";}};});
