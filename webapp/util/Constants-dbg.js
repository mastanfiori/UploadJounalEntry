/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function() {
    "use strict";

    return {
    	//IDs
    	UploadPageHeldDocSmartTableID: "sap.fin.gl.journalentry.upload.HeldDoc.SmartTable",
    	UploadPageHeldDocTableID: "sap.fin.gl.journalentry.upload.HeldDoc.table",
    	FileUploaderID: "sap.fin.gl.journalentry.upload.Uploader",
    	DownloadDialogFragmentID: "fin.gl.journalentry.upload.view.DownloadDialog",
    	DownloadLanguageDropdownID: "sap.fin.gl.journalentry.upload.download.languageDropdown",
    	DownloadRadioButtonID: "sap.fin.gl.journalentry.upload.download.Excel",
    	DownloadRadioButtonGroupID: "fin.gl.journalentry.upload.radioButtonGroup",
    	MessageTableID: "fin.gl.journalentry.upload.MessageTable",
    	MessageSmartTableID: "sap.fin.gl.journalentry.upload.ErrorMsg.SmartTable",
    	MessageTableTitleID: "sap.fin.gl.journalentry.upload.DispalyMessage.TableTitle",
    	//Entity
    	UploadEntitySet: "/FilesContentForUpload",
    	//Constant Number
    	PostRequestNumInOneBatch: 5,
        BLANK: " ",
        PARKED_TYPE: "V",
        ZERO: "0",
        ACTION_TYPE_SUBMIT: "SUBMIT",
        ACTION_TYPE_POST: "POST",
        MAXIMUM_ALLOWED_ENTRIES: 16000,
        INITIAL_GUID: "00000000-0000-0000-0000-000000000000"
    };
});