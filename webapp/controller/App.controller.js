/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["fin/gl/journalentry/upload/controller/BaseController","sap/ui/model/json/JSONModel"],function(B,J){"use strict";return B.extend("fin.gl.journalentry.upload.controller.App",{onInit:function(){var v,s,o=this.getView().getBusyIndicatorDelay();var l=sap.ui.getCore().getConfiguration().getSAPLogonLanguage();v=new J({busy:true,delay:0,language:l,workflowActive:false});this.setModel(v,"appView");this.getWorkflowStatus();s=function(){v.setProperty("/busy",false);v.setProperty("/delay",o);};this.getOwnerComponent().getModel().metadataLoaded().then(s);this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());}});});
