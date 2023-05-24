/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"fin/gl/journalentry/upload/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/routing/History",
		"fin/gl/journalentry/upload/model/formatter",
		"fin/gl/journalentry/upload/util/Constants",
		"fin/gl/journalentry/upload/util/Util",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/core/Item",
	    "sap/ui/model/Sorter",
	    "sap/m/MessageToast"
	], function (BaseController, JSONModel, History, formatter, Constants, Util, Filter, FilterOperator, Item, Sorter, MessageToast) {
		"use strict";

		return BaseController.extend("fin.gl.journalentry.upload.controller.Upload", {


/* =========================================================== */
/* global variable                                             */
/* =========================================================== */
			formatter: formatter,
			_oHeldDocSmartTable: undefined,
			_oHeldDocTable: undefined,
			_sTokenForUpload: undefined,
			_oMessageStrip: undefined,
			_oDownloadDialog: undefined,
			_sBatchID: undefined,
			_iUploadedEntriesNum: undefined,
			_bIsInitialUpload: undefined,
			_iNumberOfDocumentsToBeUploaded: undefined,
			_iNumberOfDocumentsUploaded: undefined,
			_iNumberOfDocumentsUploadedWarning: undefined,
			_bNeedClearSelection: undefined,
			_sDateFrom: undefined,
			_sDateTo: undefined,
			_sDateFromForCtrl: undefined,
			_sDateToForCtrl: undefined,
			_sDateFromLog: undefined,
			_sDateToLog: undefined,
			_oPage: undefined,
			_bShowMsgToast: false,
			_bShowPostMsgStrip: false,
			_bShowActionFinishInfoMsgBox: false,
			_sActionType: undefined,
			//_oPostInfoOfTable: undefined,
			_iPostEntryNum: undefined,
			_iPostSuccessNum: undefined,
			_iPostErrorNum: undefined,
			_iPostWarningNum: undefined,
			_bIgnoreWarning: false,
			_aSelectedIndices: undefined,
			_aMsgArrayForSinglePost: undefined,
			_iPostTotalNum: undefined,
			_bNotRebindInRouteMatch: false,
			_aSelectedUnpostedEntries: undefined,
			_iSelectedUnpostedEntriesNum: 0,
			_aFilterOfTable: undefined,
			_bUseOldFilter: false,
			_bNoEntriesToBeUploaded: false,
			_bOlnyHaveWarning: undefined,
			_bCheckMessageExpire: undefined,
			_sMessageStripText: undefined,
			_sOrigin: undefined,
			_sPostingButtonStatus: undefined,
			
			_oSmartTableInitializePromise: undefined,
			_oSmartTableInitializeResolve: undefined,

/* =========================================================== */
/* lifecycle methods                                           */
/* =========================================================== */

			/**
			 * Called when the upload controller is instantiated.
			 * @public
			 */
			onInit : function () {
				BaseController.prototype.onInit.call(this);
				//var oViewModel,iOriginalBusyDelay;
				this._oHeldDocTable = this.byId(Constants.UploadPageHeldDocTableID);
				this.oRouter.attachRouteMatched(this.onRouteMatched, this);
				this._oPage = this.byId("sap.fin.gl.journalentry.upload.UploadPage");
            	this._oPage.setBusyIndicatorDelay(1);
            	
				this._oHeldDocSmartTable = this.byId(Constants.UploadPageHeldDocSmartTableID);
				
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
				
				this._oHeldDocSmartTable.addStyleClass("sapUiMediumMarginBeginEnd");
				
				this._setTableRowCount("0");
				var sNoDataText = this.getResourceBundle().getText("uploadTableNoDataText");
				this._oHeldDocSmartTable.setNoData(sNoDataText);
				this._oHeldDocTable.setNoData(sNoDataText);
				
				// instance a promise for SmartTable
				var that = this;
				this._oSmartTableInitializePromise = new Promise(function(resolve){
					that._oSmartTableInitializeResolve = resolve;
				});
			},
			
			/**
			 * Handle control rendering event.
			 */
			onBeforeRendering: function() {
				var sCozyClass = "sapUiSizeCozy", sCompactClass = "sapUiSizeCompact", sCondenseClass = "sapUiSizeCondensed";
				if (this._oHeldDocTable) {
					if (jQuery(document.body).hasClass(sCompactClass) || this.getOwnerComponent().getContentDensityClass() === sCompactClass) {
						this._oHeldDocTable.addStyleClass(sCondenseClass);
					} else if (jQuery(document.body).hasClass(sCozyClass) || this.getOwnerComponent().getContentDensityClass() === sCozyClass) {
						this._oHeldDocTable.addStyleClass(sCozyClass);
					}
				}
			},

			
			onRouteMatched: function(oEvent) {
				// Hide the Post button if navigate from verify general journal entries app
				if(this.getOwnerComponent().getComponentData()){
					if(this.getOwnerComponent().getComponentData().startupParameters){
						if(this.getOwnerComponent().getComponentData().startupParameters.Origin){
							this._sOrigin = this.getOwnerComponent().getComponentData().startupParameters.Origin[0];	
						}
					}
				}
				
            	var sFullUrl = window.location.href;
            	var oUrlParsing = sap.ushell.Container.getService("URLParsing");
            	var sShellHash = "";
            	// true will represent Submit, and false will represent Post
            	var bSubmitPostSwitcher = false;
            	
            	if (sFullUrl && oUrlParsing) {
            		sShellHash = oUrlParsing.getShellHash(sFullUrl);
            	}
            	
            	// For semantic action AccountingDocument-uploadGLDocforSubmit, submit is expected
            	if(sShellHash && sShellHash.indexOf("AccountingDocument-uploadGLDocforSubmit") > -1) {
            		bSubmitPostSwitcher = true;
            	}
				
				var oUIModel = this.getView().getModel("ui");
				if(this._sOrigin === "RequesterWorklist" || bSubmitPostSwitcher) {
					oUIModel.setProperty("/postBtnVisible", false);
					oUIModel.setProperty("/submitBtnVisible", true);
					// set button style respectively
					oUIModel.setProperty("/postBtnEmphasized", "Default");
					oUIModel.setProperty("/submitBtnEmphasized", "Emphasized");
					// only submit button is enabled in Post General Journal Entries app
					this._sPostingButtonStatus = 'S';
					
				} else {
					oUIModel.setProperty("/postBtnVisible", true);
					oUIModel.setProperty("/submitBtnVisible", false);
					// set button style respectively
					oUIModel.setProperty("/postBtnEmphasized", "Emphasized");
					oUIModel.setProperty("/submitBtnEmphasized", "Default");
					// only post button is enabled in Post General Journal Entries app
					this._sPostingButtonStatus = 'P';
				}
				
				var sPatternName = oEvent.getParameter("name");
            	//var oUIModel = this.getView().getModel("ui");
            	if (sPatternName === "message") {
            		//Jump from upload page to message page.
            		this._bNotRebindInRouteMatch = true;
            	}else if (sPatternName === "upload-external" && this._bNotRebindInRouteMatch) {
            		//Jump from message page to upload page.
            		this._bNotRebindInRouteMatch = false;
            	}else if (sPatternName === "upload-external" && !this._bNotRebindInRouteMatch) {
            		//Jump from other application to upload page.
                	var oPromise = this.retrieveAppState();
                	var that = this;
                	oPromise.done(function(oAppData, oURLParameters, sNavType) {
                		that._oSmartTableInitializePromise.then(function(){
                			that._HandleRetrieveAppStatePromiseDone(oAppData);
                		}, that);
                	}.bind(this));
            	}
			},
			
			/**
			 * 
			 */
			_HandleRetrieveAppStatePromiseDone: function(oAppData) {
        		if(oAppData && oAppData.customData) {
            		var oCustomData = oAppData.customData;
            		this._sBatchID = oCustomData.BatchID;
            		this._iUploadedEntriesNum = oCustomData.UploadedNumInBatch;
            		this._sDateFrom = oCustomData.DateFrom;
            		this._sDateTo = oCustomData.DateTo;
            		this._sDateFromForCtrl = oCustomData.DateFromCtrl;
            		this._sDateToForCtrl = oCustomData.DateToCtrl;
            		this._sDateFromLog = oCustomData.DateFromLog;
            		this._sDateToLog = oCustomData.DateToLog;
            		//var oMsgModel = oCustomData.MsgModel;
            		if (oCustomData.ShowMsgStrip) {
            			//If have message strip, should check if there are some messages expired.
    					this._sMessageStripText = oCustomData.MsgStripText;
    					this._insertMessageStrip(oCustomData.MsgStripText, oCustomData.MsgStripType);
            		}
            		this._restoreDatePickerValue();
            		this._bClearFilterStatus = true;
            		if (this._sBatchID || this._sDateFrom || this._sDateTo) {
            			this._oHeldDocSmartTable.rebindTable();
            		}
        		}
			},
			
			
			
/* =========================================================== */
/* event handlers                                              */
/* =========================================================== */
			
			onFileChange: function() {
				//This event fired when user select a file to upload.
				this._addTokenToUploader();
				var oFileUploader = this.byId(Constants.FileUploaderID);
				if(oFileUploader.getValue()) {
					this._hideMessageStrip();
					
					var sActionType = "";
					// for parked document, the auto reversal fields is not supported
					if(this._isSubmitProcess()) {
						sActionType = "S";
					}
					
					var oUploadParamter = new sap.ui.unified.FileUploaderParameter({
						name: "ActionType",
						value: sActionType
					});
					oFileUploader.addHeaderParameter(oUploadParamter);
					
			    	oFileUploader.upload();
			    	this._oPage.setBusy(true);
				}
			},

			onShowLogButtonPressed: function(oEvent) {
            	var oParameters = {
                	"LogObjectId": "FIGL_UPLDGLJE",
                	"LogExternalId": "",
                	"LogObjectSubId": "",
                	"PersKey": "fin.gl.journalentry.upload.ShowLog",
                	"DateFrom": "",
                	"DateTo": ""
            	};
            	if(this._sBatchID) {
            		oParameters.LogExternalId = this._sBatchID;
            	}
            	if (this._sDateFrom && this._sDateTo) {
            		var sDateFrom = this._sDateFromLog.slice(0, 10), 
            		    sDateTo = this._sDateToLog.slice(0, 10);
            		sDateFrom = sDateFrom.replace(/\-/g, "");
            		sDateTo = sDateTo.replace(/\-/g, "");
            		oParameters.DateFrom = sDateFrom;
            		oParameters.DateTo = sDateTo;
            		oParameters.LogExternalId = this._getBatchIDForShowLog();
            	}
            	var oInnerAppState = this._generateAppState();
				var fnOnError = function(oResponse) {
                	if (oResponse._sErrorCode && oResponse._sErrorCode === "NavigationHandler.isIntentSupported.notSupported") {
                		sap.m.MessageBox.error(this.getResourceBundle().getText("IntentErrorText"));
                	}
            	}.bind(this);
            	
            	this.oRouter.detachRouteMatched(this.onRouteMatched, this);
            	this.oNavigationHandler.navigate("FinanceApplicationLog", "showList", oParameters, oInnerAppState, fnOnError);
        	},
			
			handleUploadComplete: function(oEvent) {
				//Triggered when upload request is responed.
				var oResponse = oEvent.getParameters("response");
		    	var sResponse = oResponse.responseRaw;
		    	if (oResponse.status === 201) {
		    		//Successfully Uploaded
		    		var oUploadedInfo = this._parseUploadedInfo(sResponse);
		        	this._sBatchID = oUploadedInfo.BatchID;
		        	this._bIsInitialUpload = oUploadedInfo.IsInitialUpload;
		        	this._iNumberOfDocumentsToBeUploaded = oUploadedInfo.NumberOfDocumentsToBeUploaded;
		        	this._iNumberOfDocumentsUploaded = oUploadedInfo.NumberOfDocumentsUploaded;
		        	this._iNumberOfDocumentsUploadedWarning = oUploadedInfo.NumberOfDocumentsUploadedWithWarnings;
		        	this._bNoEntriesToBeUploaded = false;
		        	if (this._iNumberOfDocumentsToBeUploaded !== 0 && this._iNumberOfDocumentsToBeUploaded === this._iNumberOfDocumentsUploaded &&
		        	    this._iNumberOfDocumentsUploadedWarning === 0) {
		        		//All entries are uploaded successfully.
		        		this._insertMessageStrip(this.getResourceBundle().getText("AppLogMsgStrip"), "Success");
		        	} else if (this._iNumberOfDocumentsToBeUploaded !== 0 && this._iNumberOfDocumentsToBeUploaded === this._iNumberOfDocumentsUploaded && 
		        	           this._iNumberOfDocumentsUploadedWarning > 0) {
		        		//All entries are uploaded, but some contain warning.
		        		this._insertMessageStrip(this.getResourceBundle().getText("UploadWithWarning"), "Warning");
		        	} else if (this._iNumberOfDocumentsUploaded > 0 && this._iNumberOfDocumentsToBeUploaded > this._iNumberOfDocumentsUploaded) {
		        		//Some entries are uploaded successfully.
		        		this._insertMessageStrip(this.getResourceBundle().getText("HaveBatchIDMsgStrip"), "Error");
		        	} else {
		        		//No entries are uploaded
		        		this._insertMessageStrip(this.getResourceBundle().getText("NoBatchIDMsgStrip"), "Error");
		        		if (this._iNumberOfDocumentsToBeUploaded === 0) {
		        		    this._bNoEntriesToBeUploaded = true;
		        		}
		        	}
		        	this._sDateFrom = undefined;
		        	this._sDateTo = undefined;
		        	this._bShowMsgToast = true;
		        	//this.getModel("ui").setProperty("/BatchID", this._sBatchID);
		        	this._bClearFilterStatus = true;
		        	this._oHeldDocSmartTable.rebindTable();
		    	} else {
                	//Have some content error with the uploaded file
		    		if(sResponse === "CSRF token validation failed") {
		    			//Token is not validate. Have checked in different language.
		    			this._oPage.setBusy(false);
		    			sap.m.MessageBox.error(this.getResourceBundle().getText("LoginTimeOutMsg"));
		    			return;
		    		}
                	this._insertMessageStrip(this.getResourceBundle().getText("errorText"), "Error");
                	this._sBatchID = undefined;
                	this._iUploadedEntriesNum = undefined;
                	this._oHeldDocTable.unbindRows();
                	this._setTableRowCount("0");
		    	}
		    	this._oPage.setBusy(false);
				/*var oDatePickerFrom = this.byId("sap.fin.gl.journalentry.upload.DateFrom"),
				oDatePickerTo = this.byId("sap.fin.gl.journalentry.upload.DateTo");
				oDatePickerFrom.setDateValue(undefined);
				oDatePickerTo.setDateValue(undefined);*/
				var oDateRangeSel = this.byId("sap.fin.gl.journalentry.upload.DateRange");
				oDateRangeSel.setDateValue(undefined);
				oDateRangeSel.setSecondDateValue(undefined);
				// store the parameters
				this._storeUploadPageState();
			},
			
			onTemporaryIDLinkPress: function(oEvent) {
				this._oPage.setBusy(true);
				var oContext = oEvent.getSource().getBindingContext();
				var sCurrentDocumentUUID = oContext.getProperty("ParentDraftKey");
				this._jumpToPostingApp(sCurrentDocumentUUID);
			},
			
			// onAccountingDocumentLinkPress: function(oEvent) {
			// 	this._oPage.setBusy(true);
			// 	var oContext = oEvent.getSource().getBindingContext();
				// Navigate to Post General Journal Entries application with parked document display mode if category is V ( parked document )
				// Navigate to Manage Journal Entries application if category is empty ( posted document )
			// 	this._navigateToDetailPage(oContext);
			// },
			
			onRowSelectionChange: function(oEvent) {
				//Triggered when row selection changed.
				var iIndex = oEvent.getParameter("rowIndex");
				if (this._oHeldDocTable && iIndex === -1) {
					this._iSelectedUnpostedEntriesNum = this._getSelectedIndices().length;
				}else if (this._oHeldDocTable) {
                    var aIndices = oEvent.getParameter("rowIndices");
					this._changeSelectedPostedEntryNum(aIndices);
            	}
            	var oUIModel = this.getView().getModel("ui");
                if (this._iSelectedUnpostedEntriesNum > 0) {
                    oUIModel.setProperty("/submitBtnEnabled", true);
                    oUIModel.setProperty("/postBtnEnabled", true);
                } else {
                   	oUIModel.setProperty("/submitBtnEnabled", false);
                   	oUIModel.setProperty("/postBtnEnabled", false);
                }
			},
			
			onSubmitPressed: function() {
				var fnSubmit = jQuery.proxy(function(){
					//Triggered when post button is pressed.
					this._hideMessageStrip();
					var aIndices = this._getSelectedIndices();
					this._aSelectedIndices = aIndices;
					var iPostedEntriesNum = this._getUnpostedEntries(aIndices);
					if (iPostedEntriesNum > 0) {
						sap.m.MessageBox.information(this.getResourceBundle().getText("messageSkipSubmittedItems"));
					}
	            	this._iPostEntryNum = this._aSelectedUnpostedEntries.length;
	            	this._bIgnoreWarning = false;
					if (this._sBatchID && this._checkIfWholeBatchIsSelected()) {
						//If table only have one batch in it and all unposted entries of the table is selected.
						//Use the batch ID to post entries.
						this._oPage.setBusy(true);
						this._handleMassActionInBatch(Constants.ACTION_TYPE_SUBMIT);
					} else {
						//Use held document GUID to post entries.
						this._oPage.setBusy(true);
						this._handleActionInSelectedHeldDocuments(Constants.ACTION_TYPE_SUBMIT, this._aSelectedUnpostedEntries);
					}
				}, this);
				var sDialogActionButton = this.getResourceBundle().getText("Submit");
				this._doPostSubmit(fnSubmit, sDialogActionButton);
			},
			
			onPostPressed: function() {
				var fnPost = jQuery.proxy(function(){
					//Triggered when post button is pressed.
					this._hideMessageStrip();
					var aIndices = this._getSelectedIndices();
					this._aSelectedIndices = aIndices;
					var iPostedEntriesNum = this._getUnpostedEntries(aIndices);
					if (iPostedEntriesNum > 0) {
						sap.m.MessageBox.information(this.getResourceBundle().getText("messageSkipPostedItems"));
					}
	            	this._iPostEntryNum = this._aSelectedUnpostedEntries.length;
	            	this._bIgnoreWarning = false;
	            	if (this._iPostEntryNum > 0) {
	            		this._oPage.setBusy(true);
	            	}
					if (this._sBatchID && this._checkIfWholeBatchIsSelected()) {
						//If table only have one batch in it and all unposted entries of the table is selected.
						//Use the batch ID to post entries.
						this._handleMassActionInBatch(Constants.ACTION_TYPE_POST);
					} else {
						//Use held document GUID to post entries.
						this._handleActionInSelectedHeldDocuments(Constants.ACTION_TYPE_POST, this._aSelectedUnpostedEntries);
					}
				}, this);
				var sDialogActionButton = this.getResourceBundle().getText("Post");
				this._doPostSubmit(fnPost, sDialogActionButton);
			},
			
			onBeforePopverOpens: function(oEvent) {
				//Triggered when smart link of posted Journal Entry Number pressed.
				//Store app states.
				var oParameters = oEvent.getParameters();
            	var oInnerAppState = this._generateAppState();
            	
            	this._bNotRebindInRouteMatch = true;
				this.oNavigationHandler.processBeforeSmartLinkPopoverOpens(oParameters, undefined, oInnerAppState);
			},
			
			onNavTargetsObtained: function(oEvent) {
				// Delete redundant links of smart link.
				var oEventParameters = oEvent.getParameters();
				var nLength = oEventParameters.actions.length;
				var sSemanticObject = oEventParameters.semanticObject;
				var oAction, oActionMJE, oNavArguments, sNavigationTarget;
				var bHeldDocument = oEventParameters.semanticAttributes["AccountingDocumentCategory"] === "H"? true : false;
				var bParkedDocument = oEventParameters.semanticAttributes["AccountingDocumentCategory"] === "V"? true : false;
				var sOrigin = "UploadingWorklist";
				var sTarget = "postGLDocument";
				if(this._sOrigin) {
					sOrigin = this._sOrigin;
				}
				
            	var sFullUrl = window.location.href;
            	var oUrlParsing = sap.ushell.Container.getService("URLParsing");
            	var sShellHash = "";
            	// true will represent Submit, and false will represent Post
            	var bSubmitPostSwitcher = false;
            	
            	if (sFullUrl && oUrlParsing) {
            		sShellHash = oUrlParsing.getShellHash(sFullUrl);
            	}
            	
            	// For semantic action AccountingDocument-uploadGLDocforSubmit, submit is expected
            	if(sShellHash && sShellHash.indexOf("AccountingDocument-uploadGLDocforSubmit") > -1) {
            		bSubmitPostSwitcher = true;
            	}
				
				if (bHeldDocument || bParkedDocument) {
					if(bSubmitPostSwitcher) {
						sNavigationTarget = "#AccountingDocument-submitGLDoc?";
						sTarget = "submitGLDoc";
					} else {
						sNavigationTarget = "#AccountingDocument-postGLDocument?";
						sTarget = "postGLDocument";
					}
				} else {
					if(bSubmitPostSwitcher) {
						sNavigationTarget = "#VerificationJournalEntry-manage?";
						sSemanticObject = "VerificationJournalEntry";
					} else {
						sNavigationTarget = "#AccountingDocument-manage?";
					}
					sTarget = "manage";
				}
				
				for(var i = 0; i < nLength; i++) {
			    	oAction = oEventParameters.actions.pop();
			    	if (oAction.getHref().indexOf(sNavigationTarget) >= 0) {
			        	oActionMJE = oAction;
			        	break;
			    	}
				}
				oEventParameters.actions.push(oActionMJE);
				if (oActionMJE) {
					if (bHeldDocument) {
						var sCurrentDocumentUUID = oEventParameters.semanticAttributes["ParentDraftKey"];
						oNavArguments = {
							target: {
								semanticObject: sSemanticObject,
								action: sTarget
		    	            },
							params: {
								"HeldDocGUID": sCurrentDocumentUUID,
								"Origin": sOrigin,
								"PostButtonStatus": this._sPostingButtonStatus
							}
						};
						this._showNavigationPopover(oNavArguments, oActionMJE, oEventParameters);
			    	} else if (bParkedDocument) {
			    		var sTmpId = Util.assembleDocumentTmpId(oEventParameters.semanticAttributes.CompanyCode,
			    				oEventParameters.semanticAttributes.AccountingDocument,
			    				oEventParameters.semanticAttributes.FiscalYear);
			    		oNavArguments = {
					    	target: {
						    	semanticObject: sSemanticObject,
						    	action: sTarget
					    	},
							params: {
								"TmpId": sTmpId,
								"TmpIdType" : Constants.PARKED_TYPE,
								"Origin" : sOrigin,
								"ReqStatus": oEventParameters.semanticAttributes["AccountingDocumentStatus"]
					    	}
				    	};
				    	this._showNavigationPopover(oNavArguments, oActionMJE, oEventParameters);
			    	} else {
						// oNavArguments = {
						// 	target: {
						// 		semanticObject: sSemanticObject,
						// 		action: sTarget
						// 	},
						// 	params: {
						// 		"AccountingDocument": oEventParameters.semanticAttributes[sSemanticObject],
						// 		"CompanyCode": oEventParameters.semanticAttributes.CompanyCode,
						// 		"FiscalYear": oEventParameters.semanticAttributes.FiscalYear
						// 	}
						// };
						var aMJEAction = oEventParameters.actions.filter(function(action) { return action.getKey() === "AccountingDocument-manage"; });
						oEventParameters.show(undefined, oEventParameters.mainNavigation, aMJEAction, undefined);
						// this._showNavigationPopover(oNavArguments, oActionMJE, oEventParameters, true);
			    	}
				} else {
			    	oEventParameters.actions = undefined;
			    	oEventParameters.show(undefined, oEventParameters.mainNavigation, oEventParameters.actions);
				}
			},
			
			onDownloadPress: function() {
				//Open download dialog.
				if (!this._oDownloadDialog) {
	            	this._oDownloadDialog = sap.ui.xmlfragment(this.getView().getId(), Constants.DownloadDialogFragmentID, this);
	            	this.getView().addDependent(this._oDownloadDialog);
	        	}
	        	//this._oFileUploaderDialog.close();
	        	this._oDownloadDialog.open();
			},
			
			handleDownloadPress: function() {
				// supported formant Excel, CSV ( delimiter comma ), CSV ( delimiter semicolon )
				// CSVC = CSV ( delimiter comma )
				// CSVS = CSV ( delimiter semicolon )
				var aTemplateType = ["XLSX", "CSVC", "CSVS"];
				var oRadioBtnGroup = this.byId(Constants.DownloadRadioButtonGroupID);
				var iSelectedIndex = oRadioBtnGroup.getSelectedIndex();
		    	var sFileType = aTemplateType[iSelectedIndex];
		    	var oLanguageDropdown = this.byId(Constants.DownloadLanguageDropdownID);
		    	var sLanguage = oLanguageDropdown.getSelectedKey();
		    	if(!sLanguage) {
		        	sLanguage = sap.ui.getCore().getConfiguration().getLocale().getLanguage();
		    	}
		    	var oDataModel = this.getOwnerComponent().getModel();
				var sServiceURL = oDataModel.sServiceUrl;
            	var sDownloadURL = sServiceURL + "/FilesContentForDownload(IsTemplate=1,Mimetype='" + sFileType
                	+ "')/$value?$filter=Language eq '" + sLanguage + "' and FileName eq 'JournalEntry_Template.";
            	// CSVC and CSVS will be saved as CSV file
            	if(iSelectedIndex > 0) {
            		sFileType = sFileType.toLocaleLowerCase().slice(0, 3);
            	}
            	sDownloadURL = sDownloadURL + sFileType + "'";
            	//Need to be changed @Javy
            	this.newWindowOpenerSafe(sDownloadURL);
            	// window.open(sDownloadURL);
            	//this._exportTemplate(sDownloadURL);
            	this._oDownloadDialog.close();
			},
			
			/**
			 * Open window safely.
			 */
			newWindowOpenerSafe: function(untrustedURL) {
				var newWindow=window.open();
				newWindow.opener=null;
				newWindow.location=untrustedURL;
			},
			
			
			onDownloadCancelPressed: function() {
		    	this._oDownloadDialog.close();
			},
			
			onBeforeRebindViewHeldDocsTable: function (oEvent) {
				var oBindingParams = oEvent.getParameter("bindingParams");
				if (oBindingParams) {
					//Filter
					var bCustomerFilter = false, oFilterTemp;
					if (this._bClearFilterStatus === false && this._bUseOldFilter === false) {
						//So this function is triggered by customer filter changed.
						bCustomerFilter = true;
					}
					if (!this._aFilterOfTable) {
						this._aFilterOfTable = [];
					}
					if(this._bClearFilterStatus) {
						//This function is triggered by upload completed or date picker search.
						// Clear Filter status
						this._aFilterOfTable = [];
						this._resetFilterStatus();
						this._bClearFilterStatus = false;
					}
					if (this._aFilterOfTable.length === 0) {
						oFilterTemp  = this._createBatchIdDateFilter();
						this._aFilterOfTable.push(oFilterTemp);
						oBindingParams.filters = this._aFilterOfTable;
					}
					if (this._bUseOldFilter) {
						//This function is triggered by post finished.
						this._bUseOldFilter = false;
						oBindingParams.filters = this._aFilterOfTable;
					} else if (bCustomerFilter) {
						//This function is triggered by customer filter changed.
						oFilterTemp = this._createBatchIdDateFilter();
						//oBindingParams.filters only contains customer filter before this push.
						oBindingParams.filters.push(oFilterTemp);
						this._aFilterOfTable = oBindingParams.filters;
					}

					var bSubmitSwitcher = this._isSubmitProcess();
					
					// document with auto-reversal could submitted as the parked document. 
					var oApplicationCodeFilter = [ new Filter("TransactionCode", FilterOperator.EQ, 'FBDC_P001'),
								                   new Filter("TransactionCode", FilterOperator.EQ, 'FBVB'),
					                               new Filter("TransactionCode", FilterOperator.EQ, 'FBDC_P051')];
					
//					if(!bSubmitSwitcher) {
//						oApplicationCodeFilter.push( new Filter("TransactionCode", FilterOperator.EQ, 'FBDC_P051') );
//					}
					oBindingParams.filters.push( new Filter({filters: oApplicationCodeFilter, and: false}) );
					
		        	// Sorter
		        	if (oBindingParams.sorter.length === 0) {
		        		// just one sorter is available
		        		oBindingParams.sorter = [new sap.ui.model.Sorter("BatchId", true, false),
		        		                         new sap.ui.model.Sorter("DocumentSequence", false, false),
		        		                         new sap.ui.model.Sorter("CreationDateTime", true, false)];
		        	}
				}
			},
			
			onSmartTableInitialise: function (oEvent) {
				var aColumns = this._oHeldDocTable.getColumns();
				var iLength = aColumns.length;
				//Default Column Setting
				if(aColumns.length === 8) {
					//Creation Date
					aColumns[iLength - 1].setWidth("16%");
					//Amount in CoCd
					aColumns[iLength - 2].setWidth("10%");
					//Posting Date
					aColumns[iLength - 3].setWidth("8%");
					//Company Code
					aColumns[iLength - 4].setWidth("18%");
				}
				
				this._oSmartTableInitializeResolve();
			},
			
			/*handleFromDateChange: function() {
				//If Date To is empty, give it the same value of Date From.
				var oDatePickerFrom = this.byId("sap.fin.gl.journalentry.upload.DateFrom"),
					oDatePickerTo = this.byId("sap.fin.gl.journalentry.upload.DateTo");
				var oDateFrom = oDatePickerFrom.getDateValue();
				var oDateTo = oDatePickerTo.getDateValue();
				if(!oDateTo || oDateFrom > oDateTo) {
					oDateTo = oDateFrom;
					oDatePickerTo.setDateValue(oDateTo);
				}
				oDatePickerTo.setMinDate(oDateFrom);
			},*/
			
			handleDateRangeChange: function(oEvent) {
	 			var bValid = oEvent.getParameter("valid"),
				    oEventSource = oEvent.getSource();
				if (bValid) {
					oEventSource.setValueState(sap.ui.core.ValueState.None);
					/*var oDateRangeSel = this.byId("sap.fin.gl.journalentry.upload.DateRange");
					var sDateFrom = oDateRangeSel.getDateValue();
					var sDateTo = oDateRangeSel.getSecondDateValue();*/
					this.onSearchByDate();
				} else {
					oEventSource.setValueState(sap.ui.core.ValueState.Error);
				}
			},
			
			_getDateRangeData: function() {
				//The date picker need to set time to the value.
				//Because the Creationdatetime field has time in it.
				var oDateRangeSel = this.byId("sap.fin.gl.journalentry.upload.DateRange");
				var oDateFrom = oDateRangeSel.getDateValue();
				var oDateTo = oDateRangeSel.getSecondDateValue();
				if (oDateFrom && oDateTo) {
					var oDate = new Date();
					var oAppLogDate = new Date();
					this._sDateFromForCtrl = oDateFrom.toJSON();
					// oDateTo.setHours(23);
					// oDateTo.setMinutes(59);
					// oDateTo.setSeconds(59);
					// oDateTo.setMilliseconds(999);
					this._sDateToForCtrl = oDateTo.toJSON();
					//Change date to UTC date
					oDate.setUTCFullYear(oDateFrom.getFullYear());
					oDate.setUTCMonth(oDateFrom.getMonth());
					oDate.setUTCDate(oDateFrom.getDate());
					oDate.setUTCHours(0);
					oDate.setUTCMinutes(0);
					oDate.setUTCSeconds(0);
					oDate.setUTCMilliseconds(0);
					this._sDateFrom = oDate.toJSON();
					//Date from for Application Log
					//Because in Upload APP, all dates are used UTC time.
					//But in Application Log App, all dates are used local time.
					oAppLogDate.setFullYear(oDate.getFullYear());
					oAppLogDate.setMonth(oDate.getMonth());
					oAppLogDate.setDate(oDate.getDate());
					this._sDateFromLog = oAppLogDate.toJSON();
					oDate.setUTCFullYear(oDateTo.getFullYear());
					oDate.setUTCMonth(oDateTo.getMonth());
					oDate.setUTCDate(oDateTo.getDate());
					oDate.setUTCHours(23);
					oDate.setUTCMinutes(59);
					oDate.setUTCSeconds(59);
					oDate.setUTCMilliseconds(999);	
					this._sDateTo = oDate.toJSON();
					//Date to for Application Log
					oAppLogDate.setFullYear(oDate.getFullYear());
					oAppLogDate.setMonth(oDate.getMonth());
					oAppLogDate.setDate(oDate.getDate());
					this._sDateToLog = oAppLogDate.toJSON();
				} else {
					this._sDateFrom = undefined;
            		this._sDateTo = undefined;
            		this._sDateFromForCtrl = undefined;
            		this._sDateToForCtrl = undefined;
            		this._sDateFromLog = undefined;
            		this._sDateToLog = undefined;
				}
			},
			
			onSearchByDate: function() {
				this._getDateRangeData();
				
				this._sBatchID = undefined;
			    this._bClearFilterStatus = true;
				this._oHeldDocSmartTable.rebindTable();
				this._hideMessageStrip();
				//Avoid routematched event called when hash is changed for saving state
	            this.oRouter.detachRouteMatched(this.onRouteMatched, this);
            	var oInnerAppState = this._generateAppState();
            	var oPromise = this.storeCurrentAppState(oInnerAppState);
                oPromise.then(
                        jQuery.proxy(function(oAppState) {
                            //Listening to routematched event after hashchange
                            this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                        }, this),
                        jQuery.proxy(function(oError) {
                            this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                            this._handleError(oError);
                        }, this)
                );
			},
			
			
			onTableDataReceived: function (oEvent) {
				var oParameters = oEvent.getParameters();
				var oDataReceived = oParameters.getParameters();
				var aResults = oDataReceived.data && oDataReceived.data.results;
				if (oDataReceived && this._bShowActionFinishInfoMsgBox === true) {
					this._bShowActionFinishInfoMsgBox = false;
					this._showActionFinishInfoMsgBox(this._sActionType);
				}
				if (oDataReceived && this._bShowMsgToast) {
					//Show message toast for upload.
					var sMsg;
					if (this._bNoEntriesToBeUploaded === true) {
						this._iUploadedEntriesNum = aResults.length;
						if (this._iUploadedEntriesNum > 0 && this._sBatchID) {
						    sMsg = this.getResourceBundle().getText("messageNoEntryForUpload", sLength);
						    MessageToast.show(sMsg);
						}
					} else if (this._bIsInitialUpload) {
						var sLength = aResults.length.toString();
						this._iUploadedEntriesNum = aResults.length;
						sMsg = this.getResourceBundle().getText("messageUploadSuccess", sLength);
						MessageToast.show(sMsg);
					} else {
						this._iUploadedEntriesNum = aResults.length;
						sMsg = this.getResourceBundle().getText("messageUpdatedSuccess", this._sBatchID);
						MessageToast.show(sMsg);
					}
					this._bShowMsgToast = false;
				}
				if (oDataReceived && this._iPostEntryNum > this._iPostSuccessNum && 
				    this._iPostErrorNum > 0 && this._bShowPostMsgStrip) {
					//Show post failed message strip.
					this._insertMessageStrip(this.getResourceBundle().getText("HaveBatchIDMsgStrip"), "Error");
					this._bShowPostMsgStrip = false;
				} else if (oDataReceived && this._iPostEntryNum > this._iPostSuccessNum && 
				           this._iPostErrorNum === 0 && this._iPostWarningNum > 0 && this._bShowPostMsgStrip) {
					//Show post warning message strip.
					this._insertMessageStrip(this.getResourceBundle().getText("HaveBatchIDWarningMsgStrip"), "Warning");
					this._bShowPostMsgStrip = false; 
				} else if (oDataReceived && this._iPostEntryNum === this._iPostSuccessNum && this._bShowPostMsgStrip) {
					//Post successfully.
					this._insertMessageStrip(this.getResourceBundle().getText("AppLogMsgStrip"), "Success");
					this._bShowPostMsgStrip = false;
				}
				this._updateTableRowCount();
				if (this._sBatchID && this._bIsInitialUpload) {
					//If this upload is the first time. Select all automatically.
					this._oHeldDocTable.getPlugins()[0].selectAll();
				} else if (this._bNeedClearSelection) {
            		this._oHeldDocTable.getPlugins()[0].clearSelection();
            		this._bNeedClearSelection = false;
				}
				var aSelectedIndices  = this._getSelectedIndices();
				if (aSelectedIndices.length === 0) {
				  var oUIModel = this.getView().getModel("ui");
	              oUIModel.setProperty("/postBtnEnabled", false);
	              oUIModel.setProperty("/submitBtnEnabled", false);
	              this._iSelectedUnpostedEntriesNum = 0;
				}
			},


			/**
			 * Event handler for navigating back.
			 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
			 * If not, it will navigate to the shell home
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash(),
					oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

				if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
					history.go(-1);
				} else {
					oCrossAppNavigator.toExternal({
						target: {shellHash: "#Shell-home"}
					});
				}
			},
			
			onMessageStripClosed: function () {
				var oVBox = this.byId("sap.fin.gl.journalentry.upload.UploadPage.MessageStripVbox");
				if (oVBox) {
		    		oVBox.setVisible(false);
		    	}
			},
			
			/**
			 * Event handler for refresh.
			 */
			onToolbarRefresh: function(oEvent) {
				this._getDateRangeData();
				this._storeUploadPageState();
	            this._oHeldDocSmartTable.rebindTable(true);
			},
        	
/* =========================================================== */
/* internal methods                                            */
/* =========================================================== */
        	
        	_getBatchIDForShowLog: function() {
        		if (this._oHeldDocTable.getBinding("rows") === undefined) {
        			return "";
        		}
        		var nRowLength = this._oHeldDocTable.getBinding("rows").getLength();
        		if (nRowLength === 0) {
        			return "";
        		}
        		var sBatchID = this._oHeldDocTable.getContextByIndex(0).getProperty("BatchId");
        		for (var i = 1; i < nRowLength; i++) {
					if (this._oHeldDocTable.getContextByIndex(i) && this._oHeldDocTable.getContextByIndex(i).getProperty("BatchId") !== sBatchID) {
						return "";
					}
				}
				return sBatchID;
        	},
			
			_restoreDatePickerValue: function() {
				if (this._sDateFrom && this._sDateTo) {
					var oDateRangeSel = this.byId("sap.fin.gl.journalentry.upload.DateRange");
					var oDateFrom = new Date(this._sDateFromForCtrl);
					var oDateTo = new Date(this._sDateToForCtrl);
				    oDateRangeSel.setDateValue(oDateFrom);
			  	    oDateRangeSel.setSecondDateValue(oDateTo);
				}
			},
			
			_addTokenToUploader: function() {
				//Add header parameters to file uploader.
				var oDataModel = this.getOwnerComponent().getModel();
				var sTokenForUpload = oDataModel.getSecurityToken();
				var oFileUploader = this.byId(Constants.FileUploaderID);
            	var oHeaderParameter = new sap.ui.unified.FileUploaderParameter({
                            name: "X-CSRF-Token",
                            value: sTokenForUpload
            	});
            	//Header parameter need to be removed then added.
            	oFileUploader.removeAllHeaderParameters();
            	oFileUploader.addHeaderParameter(oHeaderParameter);
            	var sUploadURL = oDataModel.sServiceUrl + Constants.UploadEntitySet;
				oFileUploader.setUploadUrl(sUploadURL);
			},
			
			_setTableRowCount: function (sNum) {
				//This is used when table unbindRows function called and onInit function.
				this._oHeldDocSmartTable.setShowRowCount(false);
				var sHeader = this.getResourceBundle().getText("ItemsHeader", sNum);
				this._oHeldDocSmartTable.setHeader(sHeader);
			},
			
			_updateTableRowCount: function() {
				//This function is used when table rebind function called.
				 this._oHeldDocSmartTable.setShowRowCount(true);
				 var sHeader = this.getResourceBundle().getText("Items");
				 this._oHeldDocSmartTable.setHeader(sHeader);
				 this._oHeldDocSmartTable.updateTableHeaderState();
			},
			
			_parseUploadedInfo: function(sResponse) {
				//Get batch ID and if this file is uploaded with batch ID information.
				var sTempStr, iIndexS, iIndexE;
				var oParseResults = {};
				iIndexS = sResponse.indexOf("<d:BatchInputSessionID>");
				iIndexE = sResponse.indexOf("</d:BatchInputSessionID>");
				if (iIndexS !== -1 && iIndexE !== -1) {
			    	sTempStr = sResponse.slice(iIndexS + 23, iIndexE);
			    	oParseResults.BatchID = sTempStr;
				}
				iIndexS = sResponse.indexOf("<d:IsInitialUpload>");
				iIndexE = sResponse.indexOf("</d:IsInitialUpload>");
				if (iIndexS !== -1 && iIndexE !== -1) {
			    	sTempStr = sResponse.slice(iIndexS + 19, iIndexE);
			    	if (sTempStr === "false") {
			    		oParseResults.IsInitialUpload = false;
			    	} else {
			    		oParseResults.IsInitialUpload = true;
			    	}
				}
				iIndexS = sResponse.indexOf("<d:NumberOfDocumentsToBeUploaded>");
				iIndexE = sResponse.indexOf("</d:NumberOfDocumentsToBeUploaded>");
				if (iIndexS !== -1 && iIndexE !== -1) {
			    	sTempStr = sResponse.slice(iIndexS + 33, iIndexE);
			    	oParseResults.NumberOfDocumentsToBeUploaded = parseInt(sTempStr);
				}
				iIndexS = sResponse.indexOf("<d:NumberOfDocumentsUploaded>");
				iIndexE = sResponse.indexOf("</d:NumberOfDocumentsUploaded>");
				if (iIndexS !== -1 && iIndexE !== -1) {
			    	sTempStr = sResponse.slice(iIndexS + 29, iIndexE);
			    	oParseResults.NumberOfDocumentsUploaded = parseInt(sTempStr);
				}
				iIndexS = sResponse.indexOf("<d:NumberOfDocumentsUploadedWithWarnings>");
				iIndexE = sResponse.indexOf("</d:NumberOfDocumentsUploadedWithWarnings>");
				if (iIndexS !== -1 && iIndexE !== -1) {
			    	sTempStr = sResponse.slice(iIndexS + 41, iIndexE);
			    	oParseResults.NumberOfDocumentsUploadedWithWarnings = parseInt(sTempStr);
				}
				return oParseResults;
			},
			
			_parseUploadMessage: function(sResponse) {
				//Analyze messages in the upload response. 
		    	var oXML;
		    	var aMessagesList = [];
		    	try {
		    		//Parse XML to an JSON model.
			    	oXML = jQuery.parseXML(sResponse);
				} catch (err) {
					oXML = null;
				}
				if(oXML) {
			    	var oErrorDetails = oXML.getElementsByTagName("errordetails");
			    	if(oErrorDetails && oErrorDetails[0].childNodes) {
			        	var aMessages = oErrorDetails[0].childNodes;
			        	var iLength = aMessages.length;
			        	for (var i = 0; i < iLength; i++) {
			        		var sCode = aMessages[i].getElementsByTagName("code")[0].textContent;
			        		var sMsg = aMessages[i].getElementsByTagName("message")[0].textContent;
			        		var sSeverity = aMessages[i].getElementsByTagName("severity")[0].textContent;
			        		if (sCode === "FDC_POSTING_001/126" || sCode === "FDC_POSTING_001/136") {
			        			if (sCode === "FDC_POSTING_001/126") {
			        				//"FDC_POSTING_001/126": x document(s) initially uploaded with batch ID $1xxxxxxxxxx
			        				//If this file has no batch ID in it, this message will be reproted.
			        				this._bIsInitialUpload = true;
			        			} else if (sCode === "FDC_POSTING_001/136") {
			        				//"FDC_POSTING_001/136": x document(s) uploaded with update on batch ID $1xxxxxxxxxx
			        				//If this file has batch ID in it, this message will be reproted.
			        				this._bIsInitialUpload = false;
			        			}
			        			//Get Batch ID from message.
			        			var aMatchResults = sMsg.match(/\$[a-zA-Z0-9]*/gi);
			        			for (var j = 0; j < aMatchResults.length; j++) {
			        				if (aMatchResults[j].length === 12) {
			        					this._sBatchID = aMatchResults[j];
			        				}
			        			}
			        		}
			        		///"IWBEP/CX_MGW_BUSI_EXCEPTION":An error occurred
			        		//This message is reported every time but has no meaning. Need not to be displayed.
			        		if (sCode !== "FDC_POSTING_001/126" && sCode !== "/IWBEP/CX_MGW_BUSI_EXCEPTION" &&
			        		    sCode !== "FDC_POSTING_001/136" && (sSeverity === "error" || sSeverity === "warning")) {
			        		    //Only report Error and Warning Messages.
			        		    if (sSeverity === "error") {
			        		    	this._bOlnyHaveWarning = false;
			        		    }
			        		    sMsg = this._catenateErrorMsg(aMessages[i].getElementsByTagName("target")[0].textContent, sMsg);
			        			var oDetails = {
			        				ErrorMessage: sMsg,
			        		    	MessageType: sSeverity
			        			};
			            		aMessagesList.push(oDetails);
			            	}
			        	}
			    	}
				}
				return aMessagesList;
			},

		    _jumpToPostingApp: function(sCurrentDocumentUUID) {
		    	var that = this;
				var sOrigin = "UploadingWorklist";
				if(this._sOrigin) {
					sOrigin = this._sOrigin;
				}
		    	var fnSuccess = jQuery.proxy(function(oResponse) {
		    		if(oResponse.HoldDocumentRestore) {
						var sTmpID = oResponse.HoldDocumentRestore.TmpId;
						var sTmpIDType = oResponse.HoldDocumentRestore.TmpIdType;
						var oParameters = {
                			"TmpId": sTmpID,
                			"TmpIdType": sTmpIDType,
                			"HeldDocGUID": sCurrentDocumentUUID,
                			"Origin": sOrigin
            			};
            			var oInnerAppState = this._generateAppState();
            			//this._navigateToPostingApp(oParameters);
            			this.oRouter.detachRouteMatched(this.onRouteMatched, this);
            			this.oNavigationHandler.navigate("AccountingDocument", "postGLDocument", oParameters, oInnerAppState);
		    		}
		    	}, this);
		    	var fnError = jQuery.proxy(function(oError) {
		    		// TODO: Add meaningful error message.
		    		that._oPage.setBusy(false);
		    	}, this);
				this._getDraftIdOfHeldDoc(sCurrentDocumentUUID, fnSuccess, fnError);
			},
			
			// _navigateToDetailPage: function(oBindingContext) {
   // 			var oInnerAppState = this._generateAppState();
   // 			this.oRouter.detachRouteMatched(this.onRouteMatched, this);
   // 			var sDocumentCategory = oBindingContext.getProperty("AccountingDocumentCategory");
   // 			var oParameters = {};
   // 			var sCompanyCode = oBindingContext.getProperty("CompanyCode");
   // 			var sAccountingDocument = oBindingContext.getProperty("AccountingDocument");
   // 			var sFiscalYear = oBindingContext.getProperty("FiscalYear");
			// 	var sOrigin = "UploadingWorklist";
			// 	if(this._sOrigin) {
			// 		sOrigin = this._sOrigin;
			// 	}
			// 	if(sDocumentCategory === 'V') {
			// 		var sTmpId = Util.assembleDocumentTmpId(sCompanyCode, sAccountingDocument, sFiscalYear);
			// 		var sReqStatus = oBindingContext.getProperty("AccountingDocumentStatus");
			// 		oParameters = {
   //             		TmpId : sTmpId,
   //             		TmpIdType : Constants.PARKED_TYPE,
   //             		Origin : sOrigin,
   //             		ReqStatus : sReqStatus
			// 		};
   //     			this.oNavigationHandler.navigate("AccountingDocument", "postGLDocument", oParameters, oInnerAppState);
			// 	} else {
			// 		oParameters = {
	  //              		CompanyCode : sCompanyCode,
	  //              		AccountingDocument : sAccountingDocument,
	  //              		FiscalYear : sFiscalYear
			// 		};
			// 		this.oNavigationHandler.navigate("AccountingDocument", "manage", oParameters, oInnerAppState);
			// 	}
			// },
			
			_generateAppState: function() {
				var oMsgModel = {};
            	//var oMessageModel = this.getModel("message");
            	var bMsgStripVisible, sMsgText = "", sMsgType = "";
            	if (this._oMessageStrip && this._oMessageStrip.getVisible()) {
            		//If have message strip, need to save the message model and status flag.
            		bMsgStripVisible = true;
            		sMsgText = this._oMessageStrip.getText();
            		sMsgType = this._oMessageStrip.getType();
            	} else {
            		bMsgStripVisible = false;
            	}
            	var oCustomData = {
            			BatchID: this._sBatchID,
            			UploadedNumInBatch: this._iUploadedEntriesNum,
            			DateFrom: this._sDateFrom,
            			DateTo: this._sDateTo,
            			DateFromCtrl: this._sDateFromForCtrl,
            			DateToCtrl: this._sDateToForCtrl,
            			DateFromLog: this._sDateFromLog,
            			DateToLog: this._sDateToLog,
            			MsgModel: oMsgModel,
            			ShowMsgStrip: bMsgStripVisible,
            			MsgStripText: sMsgText,
            			MsgStripType: sMsgType
            		};
            	var oInnerAppState = {
                	customData: oCustomData
            	};
            	return oInnerAppState;
			},
			
			_getDraftIdOfHeldDoc: function(sCurrentDocumentUUID, fnSuccess, fnError) {
				//Restore the held document, get TmpId and TmpType from the HoldDocumentGuid.
				this.getOwnerComponent().getModel().callFunction("/HoldDocumentRestore", {
					method: "POST",
					urlParameters: { 
						TmpId: "",
						TmpIdType: "",
						HoldDocumentGuid: sCurrentDocumentUUID },
					success: fnSuccess,
					error: fnError
				});
			},
			

			_getUnpostedEntries: function(aSelectedIndices) {
				//Distiguish posted and unposted entries of user's selections.
				this._aSelectedUnpostedEntries = [];
				var iPostedEntriesNum = 0;
				for (var i = 0; i < aSelectedIndices.length; i++) {
					var iIndex = aSelectedIndices[i];
					var oContext = this._oHeldDocTable.getContextByIndex(iIndex);
					if (oContext) {
						if (oContext.getProperty("TemporaryId") !== "") {
							this._aSelectedUnpostedEntries.push(iIndex);
						} else {
							iPostedEntriesNum ++;
						}
					}
				}
				return iPostedEntriesNum;
			},
			
			_changeSelectedPostedEntryNum: function (aIndices) {
				//Change selected entry number when user's selection of the table is changed.
				//Need the selected unposted entry number to deside if the post button is enabled.
				var i;
				if (this._oHeldDocTable.getPlugins()[0].isIndexSelected(aIndices[0])) {
					for (i = 0; i < aIndices.length; i++) {
						if (this._oHeldDocTable.getContextByIndex(aIndices[i]) && 
						    this._oHeldDocTable.getContextByIndex(aIndices[i]).getProperty("TemporaryId") !== "") {
							this._iSelectedUnpostedEntriesNum++;
						}
					}
				} else {
					for (i = 0; i < aIndices.length; i++) {
						if (this._oHeldDocTable.getContextByIndex(aIndices[i]) && 
						    this._oHeldDocTable.getContextByIndex(aIndices[i]).getProperty("TemporaryId") !== "") {
							this._iSelectedUnpostedEntriesNum--;
						}
					}
				}
			},
			
			_handleMassActionInBatch: function(sActionType) {
				if (this._sBatchID) {
					var sBatchID = this._sBatchID;
					var fnSuccess = jQuery.proxy(function(oData, oResponse) {
						this._bUseOldFilter = true;
						this._bShowPostMsgStrip = true;
						this._oHeldDocSmartTable.rebindTable();
						this._bShowActionFinishInfoMsgBox = true;
					    this._sActionType = sActionType;
						this._bIsInitialUpload = false;
						this._bNeedClearSelection = true;
						this._oPage.setBusy(false);
					}, this);
					var fnError = jQuery.proxy(function(oError) {
						//MessageToast.show("Unknown Error!");
						this._oPage.setBusy(false);
					}, this);
					var oParameters = {
							BatchInputSession: sBatchID,
							IgnoreWarnings: this._bIgnoreWarning
						};
					if(sActionType === Constants.ACTION_TYPE_POST) {
						this._postThroughBatchID(oParameters, fnSuccess, fnError);
					} else if(sActionType === Constants.ACTION_TYPE_SUBMIT) {
						this._submitThroughBatchID(oParameters, fnSuccess, fnError);
					}
				}
			},
			
			_postThroughBatchID: function(oParameters, fnSuccess, fnError) {
				var sBatchID = this._sBatchID;
				var fnPostSuccess = jQuery.proxy(function(oData, oResponse) {
					if(oData.HoldDocumentPost && oData.HoldDocumentPost.NumberOfPostedAcctgDocs) {
						this._iPostSuccessNum = parseInt(oData.HoldDocumentPost.NumberOfPostedAcctgDocs);
						this._iPostErrorNum = parseInt(oData.HoldDocumentPost.NumberOfAcctgDocsWithErrors);
						this._iPostWarningNum = parseInt(oData.HoldDocumentPost.NumberOfAcctgDocsWithWarnings);
					}
					fnSuccess();
				}, this);
				this.getView().getModel().callFunction("/HoldDocumentPost", {
					method: "POST",
					urlParameters: oParameters,
					success: fnPostSuccess,
					error: fnError
				});
			},
			
			
			_submitThroughBatchID: function(oParameters, fnSuccess, fnError) {
				var sBatchID = this._sBatchID;
				var fnSubmitSuccess = jQuery.proxy(function(oData, oResponse) {
					if(oData.HoldDocumentPark && oData.HoldDocumentPark.NumberOfParkedAcctgDocs) {
						this._iPostSuccessNum = parseInt(oData.HoldDocumentPark.NumberOfParkedAcctgDocs);
						this._iPostErrorNum = parseInt(oData.HoldDocumentPark.NumberOfAcctgDocsWithErrors);
						this._iPostWarningNum = parseInt(oData.HoldDocumentPark.NumberOfAcctgDocsWithWarnings);
					}
					fnSuccess();
				}, this);
				this.getView().getModel().callFunction("/HoldDocumentPark", {
					method: "POST",
					urlParameters: oParameters,
					success: fnSubmitSuccess,
					error: fnError
				});
			},

			
			_handleActionInSelectedHeldDocuments: function(sActionType, aIndices) {
				//Use parameter HoldDocumentGUID of function import "/HoldDocumentPost" to post entries one by one. 
				if (aIndices.length > 0) {
					var iIndex, sGroupID;
					this._iPostTotalNum = aIndices.length;
					this._iPostEntryNum = aIndices.length;
					this._iPostSuccessNum = 0;
					this._iPostErrorNum = 0;
					this._iPostWarningNum = 0;
					this._aMsgArrayForSinglePost = [];
					for (iIndex = 0; iIndex < aIndices.length; iIndex++) {
						var oContext = this._oHeldDocTable.getContextByIndex(aIndices[iIndex]);
						//Change group ID to let request in different batches. 
						sGroupID = "groupid" + iIndex.toString();
						var sHeldDocGUID = oContext.getProperty("ParentDraftKey");
						this._singleActionThroughHeldGUID(sActionType, sHeldDocGUID, sGroupID);
					}
					//Check if all the select entries have been posted.
					this._checkHeldGUIDMassActionFinish(sActionType);
				}
			},
			

			_singleActionThroughHeldGUID: function(sActionType, sHeldDocGUID, sGroupID) {
				if(sHeldDocGUID !== Constants.INITIAL_GUID) {
					//Post one entry through HoldDocumentGUID.
					var oParameters = { HoldDocumentGUID: sHeldDocGUID,
					                    IgnoreWarnings: this._bIgnoreWarning};
					var fnError = jQuery.proxy(function(oError) {
						this._iPostTotalNum--;
					}, this);
					if(sActionType === Constants.ACTION_TYPE_POST) {
						this._singlePostThroughHeldGUID(oParameters, sGroupID, fnError);
					} else if(sActionType === Constants.ACTION_TYPE_SUBMIT) {
						this._singleSubmitThroughHeldGUID(oParameters, sGroupID, fnError);
					}
				}
			},
			
			_singlePostThroughHeldGUID: function(oParameters, sGroupID, fnError) {
				var fnPostSuccess = jQuery.proxy(function(oData, oResponse) {
					if(oData.HoldDocumentPost && oData.HoldDocumentPost.NumberOfPostedAcctgDocs) {
						var iPostSuccessNum = parseInt(oData.HoldDocumentPost.NumberOfPostedAcctgDocs);
						var iPostErrorNum = parseInt(oData.HoldDocumentPost.NumberOfAcctgDocsWithErrors);
					    var iPostWarningNum = parseInt(oData.HoldDocumentPost.NumberOfAcctgDocsWithWarnings);
					    if(iPostSuccessNum > 0 || iPostErrorNum > 0 || iPostWarningNum > 0) {
							this._iPostSuccessNum += iPostSuccessNum;
							this._iPostErrorNum += iPostErrorNum;
							this._iPostWarningNum += iPostWarningNum;
						}
					}
					this._iPostTotalNum--;
				}, this);
				var oPromise = this.getView().getModel().callFunction("/HoldDocumentPost", { 
					method: "POST",
					urlParameters: oParameters,
					groupId: sGroupID,
					success: fnPostSuccess,
					error: fnError
				});
				return oPromise.contextCreated();
			},
			
			_singleSubmitThroughHeldGUID: function(oParameters, sGroupID, fnError) {
				var fnSubmitSuccess = jQuery.proxy(function(oData, oResponse) {
					if(oData.HoldDocumentPark && oData.HoldDocumentPark.NumberOfParkedAcctgDocs) {
						var iPostSuccessNum = parseInt(oData.HoldDocumentPark.NumberOfParkedAcctgDocs);
						var iPostErrorNum = parseInt(oData.HoldDocumentPark.NumberOfAcctgDocsWithErrors);
					    var iPostWarningNum = parseInt(oData.HoldDocumentPark.NumberOfAcctgDocsWithWarnings);
					    if(iPostSuccessNum > 0 || iPostErrorNum > 0 || iPostWarningNum > 0) {
							this._iPostSuccessNum += iPostSuccessNum;
							this._iPostErrorNum += iPostErrorNum;
							this._iPostWarningNum += iPostWarningNum;
						}
					}
					this._iPostTotalNum--;
				}, this);
				var oPromise = this.getView().getModel().callFunction("/HoldDocumentPark", { 
					method: "POST",
					urlParameters: oParameters,
					groupId: sGroupID,
					success: fnSubmitSuccess,
					error: fnError
				});
				return oPromise.contextCreated();
			},
			
			_IgnoreWarningAction: function(sActionType) {
				this._hideMessageStrip();
				this._bIgnoreWarning = true;
				this._iPostEntryNum = this._iPostEntryNum - this._iPostSuccessNum;
				if (this._sBatchID && this._checkIfWholeBatchIsSelected()) {
					//If table only have one batch in it and all unposted entries of the table is selected.
					//Use the batch ID to post entries.
					this._oPage.setBusy(true);
					this._handleMassActionInBatch(sActionType);
				} else {
					//Use held document GUID to post entries.
					this._oPage.setBusy(true);
					this._handleActionInSelectedHeldDocuments(sActionType, this._aSelectedUnpostedEntries);
				}
			},
			
			_checkIfWholeBatchIsSelected: function() {
				//Check if all the unposted entries in this batch is selected.
				if(this._aSelectedIndices.length === 
				   this._oHeldDocTable.getBinding("rows").getLength()) {
				   	return true;
				}
				var bAllUnpostedSel = true;
				for (var i = 0; i < this._iUploadedEntriesNum; i++) {
					if(this._oHeldDocTable.getContextByIndex(i).getProperty("TemporaryId") !== "") {
						//This is an unposted entry.
						if(!this._oHeldDocTable.getPlugins()[0].isIndexSelected(i)) {
							//This unposted entry hasn't been selected.
							bAllUnpostedSel = false;
						}
					} 
				}
				return bAllUnpostedSel;
			},
			
			_getTmpNameOfHeldDoc: function(sParentDraftKey) {
				//Use held document GUID to get the temporary name of the held document.
				var iBindingLength = this._oHeldDocTable.getBinding("rows").getLength();
				for (var i = 0; i < iBindingLength; i++) {
					var sKeyFromTable = this._oHeldDocTable.getContextByIndex(i).getProperty("ParentDraftKey");
					sKeyFromTable = sKeyFromTable.replace(/-/g, "");
					if(sKeyFromTable.toLocaleUpperCase() === sParentDraftKey.toLocaleUpperCase()) {
						var sName = this._oHeldDocTable.getContextByIndex(i).getProperty("TemporaryId");
						if (!sName) {
							sName = this._oHeldDocTable.getContextByIndex(i).getProperty("AccountingDocument");
						}
						return sName;
					}
				}
				return "";
			},
			
			_catenateErrorMsg: function (sTarget, sMessage) {
				//Add temporary name or document sequence in front of every message. 
				var sTmpMsg, iIndex;
				if (sTarget && sTarget.indexOf("HoldDocumentKey") !== -1) {
					//Target of the message gives the held document GUID.
				    iIndex = sTarget.indexOf("HoldDocumentKey");
					var sParentDraftKey = sTarget.slice(iIndex + 17, iIndex + 49);
					sTmpMsg = this._getTmpNameOfHeldDoc(sParentDraftKey);
					if (sTmpMsg) {
						sTmpMsg += ": ";
					}
					sTmpMsg += sMessage;
				} else if (sTarget && sTarget.indexOf("TemporaryID") !== -1) {
					//Target of the message gives the held document temporary name or the document sequence number.
					iIndex = sTarget.indexOf("TemporaryID");
					var iLength = sTarget.length;
					sTmpMsg = sTarget.slice(iIndex + 13, iLength - 2);
					if (sTmpMsg.length === 3) {
						//It's document sequence number in the message.
						sTmpMsg = this.getResourceBundle().getText("DocumentSequence") + " " + sTmpMsg;
					}
					sTmpMsg += ": " + sMessage;
				}
				else {
					sTmpMsg = sMessage;
				}
				return sTmpMsg;
			},
			
			_showActionFinishInfoMsgBox: function(sActionType) {
				//Show the message box to tell user how many entries have been posted.
				var sNumTotal = this._iPostEntryNum.toString();
				var sNumPosted = this._iPostSuccessNum.toString();
				var sNumError = this._iPostErrorNum.toString();
				var sMsgId, sMessage, sButtonText;
				if (this._iPostWarningNum > 0) {
					var sNumWarning = this._iPostWarningNum.toString();
					if(sActionType === Constants.ACTION_TYPE_SUBMIT) {
						sMsgId = "SubmitContainWarning";
						sButtonText = this.getResourceBundle().getText("IgnoreSubmit");
					} else {
						sMsgId = "PostContainWarning";
						sButtonText = this.getResourceBundle().getText("IgnorePost");
					}
					sMessage = this.getResourceBundle().getText(sMsgId, [sNumTotal, sNumPosted, sNumError, sNumWarning]);
					var that = this;
					sap.m.MessageBox.show(sMessage, {
						title: this.getResourceBundle().getText("Warning"),
        				icon: sap.m.MessageBox.Icon.WARNING,
        				actions: [sButtonText, 
        				          sap.m.MessageBox.Action.CANCEL],
        				onClose: function(oAction) {
        					if (oAction === sButtonText) {
        						that._IgnoreWarningAction(sActionType);
                        	}  else if (oAction === sap.m.MessageBox.Action.CANCEL) {
                            	return;
                        	}
        				}
    				});
				} else {
					if(sActionType === Constants.ACTION_TYPE_SUBMIT) {
						sMsgId = "SubmittedMsgBox";
					} else {
						sMsgId = "PostedMsgBox";
					}
					sMessage = this.getResourceBundle().getText(sMsgId, [sNumPosted, sNumTotal]);
					if (this._iPostErrorNum > 0) {
						sMessage += "\n";
						sMessage += this.getResourceBundle().getText("PostContainError", sNumError.toString());
					}
					sap.m.MessageBox.information(sMessage);
				}
			},
			
			_checkHeldGUIDMassActionFinish: function (sActionType) {
				//Check if all the select entries have been posted.
				if (this._iPostTotalNum <= 0) {
					//All the post entry requests have got responses.
					this._bUseOldFilter = true;
					this._bShowPostMsgStrip = true;
					this._oHeldDocSmartTable.rebindTable();
					this._bShowActionFinishInfoMsgBox = true;
					this._sActionType = sActionType;
					this._bIsInitialUpload = false;
					this._bNeedClearSelection = true;
					this._oPage.setBusy(false);
				} else {
					//Call this function recursively after a short delay.
					jQuery.sap.delayedCall(50, this, this._checkHeldGUIDMassActionFinish, [sActionType]);
				}
			},
			
			_hideMessageStrip: function() {
				if(this._oMessageStrip){
					this._oMessageStrip.setVisible(false);
					//this._bCheckMessageExpire = false;
				}
			},
			
		    _insertMessageStrip: function(sMessage, sStripType) {
		    	var oVBox = this.byId("sap.fin.gl.journalentry.upload.UploadPage.MessageStripVbox");
		    	if(this._oMessageStrip){
		        	this._oMessageStrip.setText(sMessage);
		        	this._oMessageStrip.setVisible(true);
		        	this._oMessageStrip.setType(sStripType);
		    	} else {
		    		var sLinkText = this.getResourceBundle().getText("ShowLog");
		        	this._oMessageStrip = new sap.m.MessageStrip({
		            	text: sMessage,
		            	type: sStripType,
		            	showIcon: true,
		            	showCloseButton: true,
		            	visible: true,
		            	link: new sap.m.Link({
		            		text: sLinkText,
		            		press: jQuery.proxy(this.fnShowErrorList, this)				   
		            	})
		        	});
		        	
		        	this._oMessageStrip.attachClose(undefined, this.onMessageStripClosed, this);
		    	}
		    	if (oVBox) {
		    		oVBox.setVisible(true);
		        	oVBox.insertItem(this._oMessageStrip, 1);
		    	}
			},
			
			fnShowErrorList: function () {
				//this._showMessageList();
				this.onShowLogButtonPressed();
			},
			
			_showMessageList: function () {
				this.getRouter().navTo("message");
			},
			
			_resetFilterStatus: function() {
				//Clean customer filter icon.
				//Here is a limitation, we can't clean the value in the customer filter.
				//I have set a ticket to UI5, they said it's a limitation. Incident Number: 1780120261
				var aColumns = this._oHeldDocTable.getColumns();
				var iLength = aColumns.length;
				for (var i = 0; i < iLength; i++) {
					if(aColumns[i].getFiltered()) {
						aColumns[i].setFiltered(false);
						this._oHeldDocTable.filter(aColumns[i], null);
					}
				}
			},
			
			_createBatchIdDateFilter: function () {
				//Create Batch ID or Creation Date Time filter for table rebind.
				var oReturnFilter;
				var oBatchIDNotEmptyFilter = new Filter("BatchId", FilterOperator.NE, "");
				if (this._sBatchID) {
					oReturnFilter = new Filter([
						new Filter("BatchId", FilterOperator.EQ, this._sBatchID),
							oBatchIDNotEmptyFilter
						], true);
				} else if (this._sDateFrom && this._sDateTo) {
					oReturnFilter = new Filter([
		                	new Filter("CreationDateTime", FilterOperator.GE, this._sDateFrom),
		                	new Filter("CreationDateTime", FilterOperator.LE, this._sDateTo),
		                	oBatchIDNotEmptyFilter
		               	], true);
			    } else {
					oReturnFilter = oBatchIDNotEmptyFilter;
				}
				return oReturnFilter;
			},
			
			_showNavigationPopover: function(oNavArguments ,oActionMJE, oEventParameters, bPosted){
				// construct new link
				var oComponent = this.getOwnerComponent();
		    	var sHash = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation").hrefForExternal(oNavArguments, oComponent);
		    	var oLink = new sap.ui.comp.navpopover.LinkData({
			    	text: oActionMJE.getText(),
			    	href: sHash
		    	});
		    	oEventParameters.actions = [oLink];
		    	this._oPage.setBusy(false);
		    	if (bPosted) {
		    		oEventParameters.show(undefined, oEventParameters.mainNavigation, oEventParameters.actions);
		    	} else {
		    		oEventParameters.show(undefined, oLink, oEventParameters.actions, undefined);
		    	}
			},
			
			_storeUploadPageState: function() {
	            // Avoid routematched event called when hash is changed for saving state
	            this.oRouter.detachRouteMatched(this.onRouteMatched, this);
            	var oInnerAppState = this._generateAppState();
            	var oPromise = this.storeCurrentAppState(oInnerAppState);
                oPromise.then(
                        jQuery.proxy(function(oAppState) {
                            // Listening to routematched event after hashchange
                            this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                        }, this),
                        jQuery.proxy(function(oError) {
                            this.oRouter.attachRouteMatched(this.onRouteMatched, this);
                            this._handleError(oError);
                        }, this)
                );
			},
			
			_isSubmitProcess: function() {
            	var sFullUrl = window.location.href;
            	var oUrlParsing = sap.ushell.Container.getService("URLParsing");
            	var sShellHash = "";
            	
            	if (sFullUrl && oUrlParsing) {
            		sShellHash = oUrlParsing.getShellHash(sFullUrl);
            	}
            	
            	// For semantic action AccountingDocument-uploadGLDocforSubmit, submit is expected
            	if(sShellHash.indexOf("AccountingDocument-uploadGLDocforSubmit") > -1) {
            		return true;
            	}
			},
			
			_getSelectedIndices: function() {
				if(this._oHeldDocTable) {
					return this._oHeldDocTable.getPlugins()[0].getSelectedIndices();
				}
				return 0;
			},
			
			_convertAllDocumentID2String: function() {
				var aDocumentIDs = [];
				var aIndices = this._getSelectedIndices(); 
				for(var i = 0; i < aIndices.length; i++) {
					var oContext = this._oHeldDocTable.getContextByIndex(aIndices[i]);
					var sBatchId = oContext.getProperty("BatchId");
					var sDocumentSequence = oContext.getProperty("DocumentSequence");
					var sDocumentId = sBatchId + "_" + sDocumentSequence;
					aDocumentIDs.push(sDocumentId);
				}
				if(aDocumentIDs.length > 0) {
					return aDocumentIDs.join(",");
				}
			},
			
			_confirmItemCount: function() {
				this._oPage.setBusy(true);
				
				var postDeferred = new jQuery.Deferred();
				var fnCallback = jQuery.proxy(function(oData){
					var iItemCount = oData.GetHoldDocumentItemCount.ItemCount;
					if(iItemCount <= Constants.MAXIMUM_ALLOWED_ENTRIES) {
						postDeferred.resolve();
					} else {
						postDeferred.reject();
					}
				});
				
				var sDocumentIDs = this._convertAllDocumentID2String();
				
				//Restore the held document, get TmpId and TmpType from the HoldDocumentGuid.
				this.getOwnerComponent().getModel().callFunction("/GetHoldDocumentItemCount", {
					method: "GET",
					urlParameters: { 
						HoldDocumentID: sDocumentIDs
					},
					success: fnCallback
				});
				
				return postDeferred.promise();
			},
			
			_doPostSubmit: function(fnAction, sDialogActionButton) {
				var oPromise = this._confirmItemCount();
				var that = this;
				oPromise.then(fnAction).fail(function(){
					sap.m.MessageBox.warning(that.getResourceBundle().getText("MaximumEntriesLimitationWarning", sDialogActionButton),{
						actions: [sDialogActionButton, sap.m.MessageBox.Action.CANCEL],
						emphasizedAction: sDialogActionButton,
						onClose: function (sAction) {
							if(sDialogActionButton === sAction) {
								fnAction();
							} else {
								that._oPage.setBusy(false);
							}
						}
					});
				});
			}
		});
	}
);