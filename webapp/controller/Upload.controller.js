/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["fin/gl/journalentry/upload/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History",
	"fin/gl/journalentry/upload/model/formatter", "fin/gl/journalentry/upload/util/Constants", "fin/gl/journalentry/upload/util/Util",
	"sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/core/Item", "sap/ui/model/Sorter", "sap/m/MessageToast"
], function (B, J, H, f, C, U, F, a, I, S, M) {
	"use strict";
	return B.extend("fin.gl.journalentry.upload.controller.Upload", {
		formatter: f,
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
		onInit: function () {
			B.prototype.onInit.call(this);
			this._oHeldDocTable = this.byId(C.UploadPageHeldDocTableID);
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			this._oPage = this.byId("sap.fin.gl.journalentry.upload.UploadPage");
			this._oPage.setBusyIndicatorDelay(1);
			this._oHeldDocSmartTable = this.byId(C.UploadPageHeldDocSmartTableID);
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this._oHeldDocSmartTable.addStyleClass("sapUiMediumMarginBeginEnd");
			this._setTableRowCount("0");
			var n = this.getResourceBundle().getText("uploadTableNoDataText");
			this._oHeldDocSmartTable.setNoData(n);
			this._oHeldDocTable.setNoData(n);
			var t = this;
			this._oSmartTableInitializePromise = new Promise(function (r) {
				t._oSmartTableInitializeResolve = r;
			});
		},
		onBeforeRendering: function () {
			var c = "sapUiSizeCozy",
				s = "sapUiSizeCompact",
				b = "sapUiSizeCondensed";
			if (this._oHeldDocTable) {
				if (jQuery(document.body).hasClass(s) || this.getOwnerComponent().getContentDensityClass() === s) {
					this._oHeldDocTable.addStyleClass(b);
				} else if (jQuery(document.body).hasClass(c) || this.getOwnerComponent().getContentDensityClass() === c) {
					this._oHeldDocTable.addStyleClass(c);
				}
			}
		},
		onRouteMatched: function (e) {
			if (this.getOwnerComponent().getComponentData()) {
				if (this.getOwnerComponent().getComponentData().startupParameters) {
					if (this.getOwnerComponent().getComponentData().startupParameters.Origin) {
						this._sOrigin = this.getOwnerComponent().getComponentData().startupParameters.Origin[0];
					}
				}
			}
			var s = window.location.href;
			var u = sap.ushell.Container.getService("URLParsing");
			var b = "";
			var c = false;
			if (s && u) {
				b = u.getShellHash(s);
			}
			if (b && b.indexOf("AccountingDocument-uploadGLDocforSubmit") > -1) {
				c = true;
			}
			var o = this.getView().getModel("ui");
			if (this._sOrigin === "RequesterWorklist" || c) {
				o.setProperty("/postBtnVisible", false);
				o.setProperty("/submitBtnVisible", true);
				o.setProperty("/postBtnEmphasized", "Default");
				o.setProperty("/submitBtnEmphasized", "Emphasized");
				this._sPostingButtonStatus = 'S';
			} else {
				o.setProperty("/postBtnVisible", true);
				o.setProperty("/submitBtnVisible", false);
				o.setProperty("/postBtnEmphasized", "Emphasized");
				o.setProperty("/submitBtnEmphasized", "Default");
				this._sPostingButtonStatus = 'P';
			}
			var p = e.getParameter("name");
			if (p === "message") {
				this._bNotRebindInRouteMatch = true;
			} else if (p === "upload-external" && this._bNotRebindInRouteMatch) {
				this._bNotRebindInRouteMatch = false;
			} else if (p === "upload-external" && !this._bNotRebindInRouteMatch) {
				var P = this.retrieveAppState();
				var t = this;
				P.done(function (A, d, n) {
					t._oSmartTableInitializePromise.then(function () {
						t._HandleRetrieveAppStatePromiseDone(A);
					}, t);
				}.bind(this));
			}
		},
		_HandleRetrieveAppStatePromiseDone: function (A) {
			if (A && A.customData) {
				var c = A.customData;
				this._sBatchID = c.BatchID;
				this._iUploadedEntriesNum = c.UploadedNumInBatch;
				this._sDateFrom = c.DateFrom;
				this._sDateTo = c.DateTo;
				this._sDateFromForCtrl = c.DateFromCtrl;
				this._sDateToForCtrl = c.DateToCtrl;
				this._sDateFromLog = c.DateFromLog;
				this._sDateToLog = c.DateToLog;
				if (c.ShowMsgStrip) {
					this._sMessageStripText = c.MsgStripText;
					this._insertMessageStrip(c.MsgStripText, c.MsgStripType);
				}
				this._restoreDatePickerValue();
				this._bClearFilterStatus = true;
				if (this._sBatchID || this._sDateFrom || this._sDateTo) {
					this._oHeldDocSmartTable.rebindTable();
				}
			}
		},
		onFileChange: function () {
			this._addTokenToUploader();
			var o = this.byId(C.FileUploaderID);
			if (o.getValue()) {
				this._hideMessageStrip();
				var A = "";
				if (this._isSubmitProcess()) {
					A = "S";
				}
				var u = new sap.ui.unified.FileUploaderParameter({
					name: "ActionType",
					value: A
				});
				o.addHeaderParameter(u);
				o.upload();
				this._oPage.setBusy(true);
			}
		},
		onShowLogButtonPressed: function (e) {
			var p = {
				"LogObjectId": "FIGL_UPLDGLJE",
				"LogExternalId": "",
				"LogObjectSubId": "",
				"PersKey": "fin.gl.journalentry.upload.ShowLog",
				"DateFrom": "",
				"DateTo": ""
			};
			if (this._sBatchID) {
				p.LogExternalId = this._sBatchID;
			}
			if (this._sDateFrom && this._sDateTo) {
				var d = this._sDateFromLog.slice(0, 10),
					D = this._sDateToLog.slice(0, 10);
				d = d.replace(/\-/g, "");
				D = D.replace(/\-/g, "");
				p.DateFrom = d;
				p.DateTo = D;
				p.LogExternalId = this._getBatchIDForShowLog();
			}
			var i = this._generateAppState();
			var o = function (r) {
				if (r._sErrorCode && r._sErrorCode === "NavigationHandler.isIntentSupported.notSupported") {
					sap.m.MessageBox.error(this.getResourceBundle().getText("IntentErrorText"));
				}
			}.bind(this);
			this.oRouter.detachRouteMatched(this.onRouteMatched, this);
			this.oNavigationHandler.navigate("FinanceApplicationLog", "showList", p, i, o);
		},
		handleUploadComplete: function (e) {
			var r = e.getParameters("response");
			var R = r.responseRaw;
			if (r.status === 201) {
				var u = this._parseUploadedInfo(R);
				this._sBatchID = u.BatchID;
				this._bIsInitialUpload = u.IsInitialUpload;
				this._iNumberOfDocumentsToBeUploaded = u.NumberOfDocumentsToBeUploaded;
				this._iNumberOfDocumentsUploaded = u.NumberOfDocumentsUploaded;
				this._iNumberOfDocumentsUploadedWarning = u.NumberOfDocumentsUploadedWithWarnings;
				this._bNoEntriesToBeUploaded = false;
				if (this._iNumberOfDocumentsToBeUploaded !== 0 && this._iNumberOfDocumentsToBeUploaded === this._iNumberOfDocumentsUploaded &&
					this._iNumberOfDocumentsUploadedWarning === 0) {
					this._insertMessageStrip(this.getResourceBundle().getText("AppLogMsgStrip"), "Success");
				} else if (this._iNumberOfDocumentsToBeUploaded !== 0 && this._iNumberOfDocumentsToBeUploaded === this._iNumberOfDocumentsUploaded &&
					this._iNumberOfDocumentsUploadedWarning > 0) {
					this._insertMessageStrip(this.getResourceBundle().getText("UploadWithWarning"), "Warning");
				} else if (this._iNumberOfDocumentsUploaded > 0 && this._iNumberOfDocumentsToBeUploaded > this._iNumberOfDocumentsUploaded) {
					this._insertMessageStrip(this.getResourceBundle().getText("HaveBatchIDMsgStrip"), "Error");
				} else {
					this._insertMessageStrip(this.getResourceBundle().getText("NoBatchIDMsgStrip"), "Error");
					if (this._iNumberOfDocumentsToBeUploaded === 0) {
						this._bNoEntriesToBeUploaded = true;
					}
				}
				this._sDateFrom = undefined;
				this._sDateTo = undefined;
				this._bShowMsgToast = true;
				this._bClearFilterStatus = true;
				this._oHeldDocSmartTable.rebindTable();
			} else {
				if (R === "CSRF token validation failed") {
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
			var d = this.byId("sap.fin.gl.journalentry.upload.DateRange");
			d.setDateValue(undefined);
			d.setSecondDateValue(undefined);
			this._storeUploadPageState();
		},
		onTemporaryIDLinkPress: function (e) {
			this._oPage.setBusy(true);
			var c = e.getSource().getBindingContext();
			var s = c.getProperty("ParentDraftKey");
			this._jumpToPostingApp(s);
		},
		onRowSelectionChange: function (e) {
			var i = e.getParameter("rowIndex");
			if (this._oHeldDocTable && i === -1) {
				this._iSelectedUnpostedEntriesNum = this._getSelectedIndices().length;
			} else if (this._oHeldDocTable) {
				var b = e.getParameter("rowIndices");
				this._changeSelectedPostedEntryNum(b);
			}
			var u = this.getView().getModel("ui");
			if (this._iSelectedUnpostedEntriesNum > 0) {
				u.setProperty("/submitBtnEnabled", true);
				u.setProperty("/postBtnEnabled", true);
			} else {
				u.setProperty("/submitBtnEnabled", false);
				u.setProperty("/postBtnEnabled", false);
			}
		},
		onSubmitPressed: function () {
			var s = jQuery.proxy(function () {
				this._hideMessageStrip();
				var i = this._getSelectedIndices();
				this._aSelectedIndices = i;
				var p = this._getUnpostedEntries(i);
				if (p > 0) {
					sap.m.MessageBox.information(this.getResourceBundle().getText("messageSkipSubmittedItems"));
				}
				this._iPostEntryNum = this._aSelectedUnpostedEntries.length;
				this._bIgnoreWarning = false;
				if (this._sBatchID && this._checkIfWholeBatchIsSelected()) {
					this._oPage.setBusy(true);
					this._handleMassActionInBatch(C.ACTION_TYPE_SUBMIT);
				} else {
					this._oPage.setBusy(true);
					this._handleActionInSelectedHeldDocuments(C.ACTION_TYPE_SUBMIT, this._aSelectedUnpostedEntries);
				}
			}, this);
			var d = this.getResourceBundle().getText("Submit");
			this._doPostSubmit(s, d);
		},
		onPostPressed: function () {
			var p = jQuery.proxy(function () {
				this._hideMessageStrip();
				var i = this._getSelectedIndices();
				this._aSelectedIndices = i;
				var P = this._getUnpostedEntries(i);
				if (P > 0) {
					sap.m.MessageBox.information(this.getResourceBundle().getText("messageSkipPostedItems"));
				}
				this._iPostEntryNum = this._aSelectedUnpostedEntries.length;
				this._bIgnoreWarning = false;
				if (this._iPostEntryNum > 0) {
					this._oPage.setBusy(true);
				}
				if (this._sBatchID && this._checkIfWholeBatchIsSelected()) {
					this._handleMassActionInBatch(C.ACTION_TYPE_POST);
				} else {
					this._handleActionInSelectedHeldDocuments(C.ACTION_TYPE_POST, this._aSelectedUnpostedEntries);
				}
			}, this);
			var d = this.getResourceBundle().getText("Post");
			this._doPostSubmit(p, d);
		},
		onBeforePopverOpens: function (e) {
			var p = e.getParameters();
			var i = this._generateAppState();
			this._bNotRebindInRouteMatch = true;
			this.oNavigationHandler.processBeforeSmartLinkPopoverOpens(p, undefined, i);
		},
		onNavTargetsObtained: function (e) {
			var E = e.getParameters();
			var n = E.actions.length;
			var s = E.semanticObject;
			var A, o, N, b;
			var h = E.semanticAttributes["AccountingDocumentCategory"] === "H" ? true : false;
			var p = E.semanticAttributes["AccountingDocumentCategory"] === "V" ? true : false;
			var O = "UploadingWorklist";
			var t = "postGLDocument";
			if (this._sOrigin) {
				O = this._sOrigin;
			}
			var c = window.location.href;
			var u = sap.ushell.Container.getService("URLParsing");
			var d = "";
			var g = false;
			if (c && u) {
				d = u.getShellHash(c);
			}
			if (d && d.indexOf("AccountingDocument-uploadGLDocforSubmit") > -1) {
				g = true;
			}
			if (h || p) {
				if (g) {
					b = "#AccountingDocument-submitGLDoc?";
					t = "submitGLDoc";
				} else {
					b = "#AccountingDocument-postGLDocument?";
					t = "postGLDocument";
				}
			} else {
				if (g) {
					b = "#VerificationJournalEntry-manage?";
					s = "VerificationJournalEntry";
				} else {
					b = "#AccountingDocument-manage?";
				}
				t = "manage";
			}
			for (var i = 0; i < n; i++) {
				A = E.actions.pop();
				if (A.getHref().indexOf(b) >= 0) {
					o = A;
					break;
				}
			}
			E.actions.push(o);
			if (o) {
				if (h) {
					var j = E.semanticAttributes["ParentDraftKey"];
					N = {
						target: {
							semanticObject: s,
							action: t
						},
						params: {
							"HeldDocGUID": j,
							"Origin": O,
							"PostButtonStatus": this._sPostingButtonStatus
						}
					};
					this._showNavigationPopover(N, o, E);
				} else if (p) {
					var T = U.assembleDocumentTmpId(E.semanticAttributes.CompanyCode, E.semanticAttributes.AccountingDocument, E.semanticAttributes.FiscalYear);
					N = {
						target: {
							semanticObject: s,
							action: t
						},
						params: {
							"TmpId": T,
							"TmpIdType": C.PARKED_TYPE,
							"Origin": O,
							"ReqStatus": E.semanticAttributes["AccountingDocumentStatus"]
						}
					};
					this._showNavigationPopover(N, o, E);
				} else {
					var m = E.actions.filter(function (k) {
						return k.getKey() === "AccountingDocument-manage";
					});
					E.show(undefined, E.mainNavigation, m, undefined);
				}
			} else {
				E.actions = undefined;
				E.show(undefined, E.mainNavigation, E.actions);
			}
		},
		onDownloadPress: function () {
			if (!this._oDownloadDialog) {
				this._oDownloadDialog = sap.ui.xmlfragment(this.getView().getId(), C.DownloadDialogFragmentID, this);
				this.getView().addDependent(this._oDownloadDialog);
			}
			this._oDownloadDialog.open();
		},
		handleDownloadPress: function () {
			var t = ["XLSX", "CSVC", "CSVS"];
			var r = this.byId(C.DownloadRadioButtonGroupID);
			var s = r.getSelectedIndex();
			var b = t[s];
			var l = this.byId(C.DownloadLanguageDropdownID);
			var L = l.getSelectedKey();
			if (!L) {
				L = sap.ui.getCore().getConfiguration().getLocale().getLanguage();
			}
			var d = this.getOwnerComponent().getModel();
			var c = d.sServiceUrl;
			var D = c + "/FilesContentForDownload(IsTemplate=1,Mimetype='" + b + "')/$value?$filter=Language eq '" + L +
				"' and FileName eq 'JournalEntry_Template.";
			if (s > 0) {
				b = b.toLocaleLowerCase().slice(0, 3);
			}
			D = D + b + "'";
			this.newWindowOpenerSafe(D);
			this._oDownloadDialog.close();
		},
		newWindowOpenerSafe: function (u) {
			var n = window.open();
			n.opener = null;
			n.location = u;
		},
		onDownloadCancelPressed: function () {
			this._oDownloadDialog.close();
		},
		onBeforeRebindViewHeldDocsTable: function (e) {
			var b = e.getParameter("bindingParams");
			if (b) {
				var c = false,
					o;
				if (this._bClearFilterStatus === false && this._bUseOldFilter === false) {
					c = true;
				}
				if (!this._aFilterOfTable) {
					this._aFilterOfTable = [];
				}
				if (this._bClearFilterStatus) {
					this._aFilterOfTable = [];
					this._resetFilterStatus();
					this._bClearFilterStatus = false;
				}
				if (this._aFilterOfTable.length === 0) {
					o = this._createBatchIdDateFilter();
					this._aFilterOfTable.push(o);
					b.filters = this._aFilterOfTable;
				}
				if (this._bUseOldFilter) {
					this._bUseOldFilter = false;
					b.filters = this._aFilterOfTable;
				} else if (c) {
					o = this._createBatchIdDateFilter();
					b.filters.push(o);
					this._aFilterOfTable = b.filters;
				}
				var s = this._isSubmitProcess();
				var A = [new F("TransactionCode", a.EQ, 'FBDC_P001'), new F("TransactionCode", a.EQ, 'FBVB'), new F("TransactionCode", a.EQ,
					'FBDC_P051')];
				b.filters.push(new F({
					filters: A,
					and: false
				}));
				if (b.sorter.length === 0) {
					b.sorter = [new sap.ui.model.Sorter("BatchId", true, false), new sap.ui.model.Sorter("DocumentSequence", false, false), new sap.ui
						.model.Sorter("CreationDateTime", true, false)
					];
				}
			}
		},
		onSmartTableInitialise: function (e) {
			var c = this._oHeldDocTable.getColumns();
			var l = c.length;
			if (c.length === 8) {
				c[l - 1].setWidth("16%");
				c[l - 2].setWidth("10%");
				c[l - 3].setWidth("8%");
				c[l - 4].setWidth("18%");
			}
			this._oSmartTableInitializeResolve();
		},
		handleDateRangeChange: function (e) {
			var v = e.getParameter("valid"),
				E = e.getSource();
			if (v) {
				E.setValueState(sap.ui.core.ValueState.None);
				this.onSearchByDate();
			} else {
				E.setValueState(sap.ui.core.ValueState.Error);
			}
		},
		_getDateRangeData: function () {
			var d = this.byId("sap.fin.gl.journalentry.upload.DateRange");
			var D = d.getDateValue();
			var o = d.getSecondDateValue();
			if (D && o) {
				var b = new Date();
				var A = new Date();
				this._sDateFromForCtrl = D.toJSON();
				this._sDateToForCtrl = o.toJSON();
				b.setUTCFullYear(D.getFullYear());
				b.setUTCMonth(D.getMonth());
				b.setUTCDate(D.getDate());
				b.setUTCHours(0);
				b.setUTCMinutes(0);
				b.setUTCSeconds(0);
				b.setUTCMilliseconds(0);
				this._sDateFrom = b.toJSON();
				A.setFullYear(b.getFullYear());
				A.setMonth(b.getMonth());
				A.setDate(b.getDate());
				this._sDateFromLog = A.toJSON();
				b.setUTCFullYear(o.getFullYear());
				b.setUTCMonth(o.getMonth());
				b.setUTCDate(o.getDate());
				b.setUTCHours(23);
				b.setUTCMinutes(59);
				b.setUTCSeconds(59);
				b.setUTCMilliseconds(999);
				this._sDateTo = b.toJSON();
				A.setFullYear(b.getFullYear());
				A.setMonth(b.getMonth());
				A.setDate(b.getDate());
				this._sDateToLog = A.toJSON();
			} else {
				this._sDateFrom = undefined;
				this._sDateTo = undefined;
				this._sDateFromForCtrl = undefined;
				this._sDateToForCtrl = undefined;
				this._sDateFromLog = undefined;
				this._sDateToLog = undefined;
			}
		},
		onSearchByDate: function () {
			this._getDateRangeData();
			this._sBatchID = undefined;
			this._bClearFilterStatus = true;
			this._oHeldDocSmartTable.rebindTable();
			this._hideMessageStrip();
			this.oRouter.detachRouteMatched(this.onRouteMatched, this);
			var i = this._generateAppState();
			var p = this.storeCurrentAppState(i);
			p.then(jQuery.proxy(function (A) {
				this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			}, this), jQuery.proxy(function (e) {
				this.oRouter.attachRouteMatched(this.onRouteMatched, this);
				this._handleError(e);
			}, this));
		},
		onTableDataReceived: function (e) {
			var p = e.getParameters();
			var d = p.getParameters();
			var r = d.data && d.data.results;
			if (d && this._bShowActionFinishInfoMsgBox === true) {
				this._bShowActionFinishInfoMsgBox = false;
				this._showActionFinishInfoMsgBox(this._sActionType);
			}
			if (d && this._bShowMsgToast) {
				var m;
				if (this._bNoEntriesToBeUploaded === true) {
					this._iUploadedEntriesNum = r.length;
					if (this._iUploadedEntriesNum > 0 && this._sBatchID) {
						m = this.getResourceBundle().getText("messageNoEntryForUpload", l);
						M.show(m);
					}
				} else if (this._bIsInitialUpload) {
					var l = r.length.toString();
					this._iUploadedEntriesNum = r.length;
					m = this.getResourceBundle().getText("messageUploadSuccess", l);
					M.show(m);
				} else {
					this._iUploadedEntriesNum = r.length;
					m = this.getResourceBundle().getText("messageUpdatedSuccess", this._sBatchID);
					M.show(m);
				}
				this._bShowMsgToast = false;
			}
			if (d && this._iPostEntryNum > this._iPostSuccessNum && this._iPostErrorNum > 0 && this._bShowPostMsgStrip) {
				this._insertMessageStrip(this.getResourceBundle().getText("HaveBatchIDMsgStrip"), "Error");
				this._bShowPostMsgStrip = false;
			} else if (d && this._iPostEntryNum > this._iPostSuccessNum && this._iPostErrorNum === 0 && this._iPostWarningNum > 0 && this._bShowPostMsgStrip) {
				this._insertMessageStrip(this.getResourceBundle().getText("HaveBatchIDWarningMsgStrip"), "Warning");
				this._bShowPostMsgStrip = false;
			} else if (d && this._iPostEntryNum === this._iPostSuccessNum && this._bShowPostMsgStrip) {
				this._insertMessageStrip(this.getResourceBundle().getText("AppLogMsgStrip"), "Success");
				this._bShowPostMsgStrip = false;
			}
			this._updateTableRowCount();
			if (this._sBatchID && this._bIsInitialUpload) {
				this._oHeldDocTable.getPlugins()[0].selectAll();
			} else if (this._bNeedClearSelection) {
				this._oHeldDocTable.getPlugins()[0].clearSelection();
				this._bNeedClearSelection = false;
			}
			var s = this._getSelectedIndices();
			if (s.length === 0) {
				var u = this.getView().getModel("ui");
				u.setProperty("/postBtnEnabled", false);
				u.setProperty("/submitBtnEnabled", false);
				this._iSelectedUnpostedEntriesNum = 0;
			}
		},
		onNavBack: function () {
			var p = H.getInstance().getPreviousHash(),
				c = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (p !== undefined || !c.isInitialNavigation()) {
				history.go(-1);
			} else {
				c.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},
		onMessageStripClosed: function () {
			var v = this.byId("sap.fin.gl.journalentry.upload.UploadPage.MessageStripVbox");
			if (v) {
				v.setVisible(false);
			}
		},
		onToolbarRefresh: function (e) {
			this._getDateRangeData();
			this._storeUploadPageState();
			this._oHeldDocSmartTable.rebindTable(true);
		},
		_getBatchIDForShowLog: function () {
			if (this._oHeldDocTable.getBinding("rows") === undefined) {
				return "";
			}
			var n = this._oHeldDocTable.getBinding("rows").getLength();
			if (n === 0) {
				return "";
			}
			var b = this._oHeldDocTable.getContextByIndex(0).getProperty("BatchId");
			for (var i = 1; i < n; i++) {
				if (this._oHeldDocTable.getContextByIndex(i) && this._oHeldDocTable.getContextByIndex(i).getProperty("BatchId") !== b) {
					return "";
				}
			}
			return b;
		},
		_restoreDatePickerValue: function () {
			if (this._sDateFrom && this._sDateTo) {
				var d = this.byId("sap.fin.gl.journalentry.upload.DateRange");
				var D = new Date(this._sDateFromForCtrl);
				var o = new Date(this._sDateToForCtrl);
				d.setDateValue(D);
				d.setSecondDateValue(o);
			}
		},
		_addTokenToUploader: function () {
			var d = this.getOwnerComponent().getModel();
			var t = d.getSecurityToken();
			var o = this.byId(C.FileUploaderID);
			var h = new sap.ui.unified.FileUploaderParameter({
				name: "X-CSRF-Token",
				value: t
			});
			o.removeAllHeaderParameters();
			o.addHeaderParameter(h);
			var u = d.sServiceUrl + C.UploadEntitySet;
			o.setUploadUrl(u);
		},
		_setTableRowCount: function (n) {
			this._oHeldDocSmartTable.setShowRowCount(false);
			var h = this.getResourceBundle().getText("ItemsHeader", n);
			this._oHeldDocSmartTable.setHeader(h);
		},
		_updateTableRowCount: function () {
			this._oHeldDocSmartTable.setShowRowCount(true);
			var h = this.getResourceBundle().getText("Items");
			this._oHeldDocSmartTable.setHeader(h);
			this._oHeldDocSmartTable.updateTableHeaderState();
		},
		_parseUploadedInfo: function (r) {
			var t, i, b;
			var p = {};
			i = r.indexOf("<d:BatchInputSessionID>");
			b = r.indexOf("</d:BatchInputSessionID>");
			if (i !== -1 && b !== -1) {
				t = r.slice(i + 23, b);
				p.BatchID = t;
			}
			i = r.indexOf("<d:IsInitialUpload>");
			b = r.indexOf("</d:IsInitialUpload>");
			if (i !== -1 && b !== -1) {
				t = r.slice(i + 19, b);
				if (t === "false") {
					p.IsInitialUpload = false;
				} else {
					p.IsInitialUpload = true;
				}
			}
			i = r.indexOf("<d:NumberOfDocumentsToBeUploaded>");
			b = r.indexOf("</d:NumberOfDocumentsToBeUploaded>");
			if (i !== -1 && b !== -1) {
				t = r.slice(i + 33, b);
				p.NumberOfDocumentsToBeUploaded = parseInt(t);
			}
			i = r.indexOf("<d:NumberOfDocumentsUploaded>");
			b = r.indexOf("</d:NumberOfDocumentsUploaded>");
			if (i !== -1 && b !== -1) {
				t = r.slice(i + 29, b);
				p.NumberOfDocumentsUploaded = parseInt(t);
			}
			i = r.indexOf("<d:NumberOfDocumentsUploadedWithWarnings>");
			b = r.indexOf("</d:NumberOfDocumentsUploadedWithWarnings>");
			if (i !== -1 && b !== -1) {
				t = r.slice(i + 41, b);
				p.NumberOfDocumentsUploadedWithWarnings = parseInt(t);
			}
			return p;
		},
		_parseUploadMessage: function (r) {
			var x;
			var m = [];
			try {
				x = jQuery.parseXML(r);
			} catch (e) {
				x = null;
			}
			if (x) {
				var E = x.getElementsByTagName("errordetails");
				if (E && E[0].childNodes) {
					var b = E[0].childNodes;
					var l = b.length;
					for (var i = 0; i < l; i++) {
						var c = b[i].getElementsByTagName("code")[0].textContent;
						var s = b[i].getElementsByTagName("message")[0].textContent;
						var d = b[i].getElementsByTagName("severity")[0].textContent;
						if (c === "FDC_POSTING_001/126" || c === "FDC_POSTING_001/136") {
							if (c === "FDC_POSTING_001/126") {
								this._bIsInitialUpload = true;
							} else if (c === "FDC_POSTING_001/136") {
								this._bIsInitialUpload = false;
							}
							var g = s.match(/\$[a-zA-Z0-9]*/gi);
							for (var j = 0; j < g.length; j++) {
								if (g[j].length === 12) {
									this._sBatchID = g[j];
								}
							}
						}
						if (c !== "FDC_POSTING_001/126" && c !== "/IWBEP/CX_MGW_BUSI_EXCEPTION" && c !== "FDC_POSTING_001/136" && (d === "error" || d ===
								"warning")) {
							if (d === "error") {
								this._bOlnyHaveWarning = false;
							}
							s = this._catenateErrorMsg(b[i].getElementsByTagName("target")[0].textContent, s);
							var D = {
								ErrorMessage: s,
								MessageType: d
							};
							m.push(D);
						}
					}
				}
			}
			return m;
		},
		_jumpToPostingApp: function (c) {
			var t = this;
			var o = "UploadingWorklist";
			if (this._sOrigin) {
				o = this._sOrigin;
			}
			var s = jQuery.proxy(function (r) {
				if (r.HoldDocumentRestore) {
					var T = r.HoldDocumentRestore.TmpId;
					var b = r.HoldDocumentRestore.TmpIdType;
					var p = {
						"TmpId": T,
						"TmpIdType": b,
						"HeldDocGUID": c,
						"Origin": o
					};
					var i = this._generateAppState();
					this.oRouter.detachRouteMatched(this.onRouteMatched, this);
					this.oNavigationHandler.navigate("AccountingDocument", "postGLDocument", p, i);
				}
			}, this);
			var e = jQuery.proxy(function (E) {
				t._oPage.setBusy(false);
			}, this);
			this._getDraftIdOfHeldDoc(c, s, e);
		},
		_generateAppState: function () {
			var m = {};
			var b, s = "",
				c = "";
			if (this._oMessageStrip && this._oMessageStrip.getVisible()) {
				b = true;
				s = this._oMessageStrip.getText();
				c = this._oMessageStrip.getType();
			} else {
				b = false;
			}
			var o = {
				BatchID: this._sBatchID,
				UploadedNumInBatch: this._iUploadedEntriesNum,
				DateFrom: this._sDateFrom,
				DateTo: this._sDateTo,
				DateFromCtrl: this._sDateFromForCtrl,
				DateToCtrl: this._sDateToForCtrl,
				DateFromLog: this._sDateFromLog,
				DateToLog: this._sDateToLog,
				MsgModel: m,
				ShowMsgStrip: b,
				MsgStripText: s,
				MsgStripType: c
			};
			var i = {
				customData: o
			};
			return i;
		},
		_getDraftIdOfHeldDoc: function (c, s, e) {
			this.getOwnerComponent().getModel().callFunction("/HoldDocumentRestore", {
				method: "POST",
				urlParameters: {
					TmpId: "",
					TmpIdType: "",
					HoldDocumentGuid: c
				},
				success: s,
				error: e
			});
		},
		_getUnpostedEntries: function (s) {
			this._aSelectedUnpostedEntries = [];
			var p = 0;
			for (var i = 0; i < s.length; i++) {
				var b = s[i];
				var c = this._oHeldDocTable.getContextByIndex(b);
				if (c) {
					if (c.getProperty("TemporaryId") !== "") {
						this._aSelectedUnpostedEntries.push(b);
					} else {
						p++;
					}
				}
			}
			return p;
		},
		_changeSelectedPostedEntryNum: function (b) {
			var i;
			if (this._oHeldDocTable.getPlugins()[0].isIndexSelected(b[0])) {
				for (i = 0; i < b.length; i++) {
					if (this._oHeldDocTable.getContextByIndex(b[i]) && this._oHeldDocTable.getContextByIndex(b[i]).getProperty("TemporaryId") !== "") {
						this._iSelectedUnpostedEntriesNum++;
					}
				}
			} else {
				for (i = 0; i < b.length; i++) {
					if (this._oHeldDocTable.getContextByIndex(b[i]) && this._oHeldDocTable.getContextByIndex(b[i]).getProperty("TemporaryId") !== "") {
						this._iSelectedUnpostedEntriesNum--;
					}
				}
			}
		},
		_handleMassActionInBatch: function (A) {
			if (this._sBatchID) {
				var b = this._sBatchID;
				var s = jQuery.proxy(function (d, r) {
					this._bUseOldFilter = true;
					this._bShowPostMsgStrip = true;
					this._oHeldDocSmartTable.rebindTable();
					this._bShowActionFinishInfoMsgBox = true;
					this._sActionType = A;
					this._bIsInitialUpload = false;
					this._bNeedClearSelection = true;
					this._oPage.setBusy(false);
				}, this);
				var e = jQuery.proxy(function (E) {
					this._oPage.setBusy(false);
				}, this);
				var p = {
					BatchInputSession: b,
					IgnoreWarnings: this._bIgnoreWarning
				};
				if (A === C.ACTION_TYPE_POST) {
					this._postThroughBatchID(p, s, e);
				} else if (A === C.ACTION_TYPE_SUBMIT) {
					this._submitThroughBatchID(p, s, e);
				}
			}
		},
		_postThroughBatchID: function (p, s, e) {
			var b = this._sBatchID;
			var P = jQuery.proxy(function (d, r) {
				if (d.HoldDocumentPost && d.HoldDocumentPost.NumberOfPostedAcctgDocs) {
					this._iPostSuccessNum = parseInt(d.HoldDocumentPost.NumberOfPostedAcctgDocs);
					this._iPostErrorNum = parseInt(d.HoldDocumentPost.NumberOfAcctgDocsWithErrors);
					this._iPostWarningNum = parseInt(d.HoldDocumentPost.NumberOfAcctgDocsWithWarnings);
				}
				s();
			}, this);
			this.getView().getModel().callFunction("/HoldDocumentPost", {
				method: "POST",
				urlParameters: p,
				success: P,
				error: e
			});
		},
		_submitThroughBatchID: function (p, s, e) {
			var b = this._sBatchID;
			var c = jQuery.proxy(function (d, r) {
				if (d.HoldDocumentPark && d.HoldDocumentPark.NumberOfParkedAcctgDocs) {
					this._iPostSuccessNum = parseInt(d.HoldDocumentPark.NumberOfParkedAcctgDocs);
					this._iPostErrorNum = parseInt(d.HoldDocumentPark.NumberOfAcctgDocsWithErrors);
					this._iPostWarningNum = parseInt(d.HoldDocumentPark.NumberOfAcctgDocsWithWarnings);
				}
				s();
			}, this);
			this.getView().getModel().callFunction("/HoldDocumentPark", {
				method: "POST",
				urlParameters: p,
				success: c,
				error: e
			});
		},
		_handleActionInSelectedHeldDocuments: function (A, i) {
			if (i.length > 0) {
				var b, g;
				this._iPostTotalNum = i.length;
				this._iPostEntryNum = i.length;
				this._iPostSuccessNum = 0;
				this._iPostErrorNum = 0;
				this._iPostWarningNum = 0;
				this._aMsgArrayForSinglePost = [];
				for (b = 0; b < i.length; b++) {
					var c = this._oHeldDocTable.getContextByIndex(i[b]);
					g = "groupid" + b.toString();
					var h = c.getProperty("ParentDraftKey");
					this._singleActionThroughHeldGUID(A, h, g);
				}
				this._checkHeldGUIDMassActionFinish(A);
			}
		},
		_singleActionThroughHeldGUID: function (A, h, g) {
			if (h !== C.INITIAL_GUID) {
				var p = {
					HoldDocumentGUID: h,
					IgnoreWarnings: this._bIgnoreWarning
				};
				var e = jQuery.proxy(function (E) {
					this._iPostTotalNum--;
				}, this);
				if (A === C.ACTION_TYPE_POST) {
					this._singlePostThroughHeldGUID(p, g, e);
				} else if (A === C.ACTION_TYPE_SUBMIT) {
					this._singleSubmitThroughHeldGUID(p, g, e);
				}
			}
		},
		_singlePostThroughHeldGUID: function (p, g, e) {
			var P = jQuery.proxy(function (d, r) {
				if (d.HoldDocumentPost && d.HoldDocumentPost.NumberOfPostedAcctgDocs) {
					var i = parseInt(d.HoldDocumentPost.NumberOfPostedAcctgDocs);
					var b = parseInt(d.HoldDocumentPost.NumberOfAcctgDocsWithErrors);
					var c = parseInt(d.HoldDocumentPost.NumberOfAcctgDocsWithWarnings);
					if (i > 0 || b > 0 || c > 0) {
						this._iPostSuccessNum += i;
						this._iPostErrorNum += b;
						this._iPostWarningNum += c;
					}
				}
				this._iPostTotalNum--;
			}, this);
			var o = this.getView().getModel().callFunction("/HoldDocumentPost", {
				method: "POST",
				urlParameters: p,
				groupId: g,
				success: P,
				error: e
			});
			return o.contextCreated();
		},
		_singleSubmitThroughHeldGUID: function (p, g, e) {
			var s = jQuery.proxy(function (d, r) {
				if (d.HoldDocumentPark && d.HoldDocumentPark.NumberOfParkedAcctgDocs) {
					var i = parseInt(d.HoldDocumentPark.NumberOfParkedAcctgDocs);
					var b = parseInt(d.HoldDocumentPark.NumberOfAcctgDocsWithErrors);
					var c = parseInt(d.HoldDocumentPark.NumberOfAcctgDocsWithWarnings);
					if (i > 0 || b > 0 || c > 0) {
						this._iPostSuccessNum += i;
						this._iPostErrorNum += b;
						this._iPostWarningNum += c;
					}
				}
				this._iPostTotalNum--;
			}, this);
			var P = this.getView().getModel().callFunction("/HoldDocumentPark", {
				method: "POST",
				urlParameters: p,
				groupId: g,
				success: s,
				error: e
			});
			return P.contextCreated();
		},
		_IgnoreWarningAction: function (A) {
			this._hideMessageStrip();
			this._bIgnoreWarning = true;
			this._iPostEntryNum = this._iPostEntryNum - this._iPostSuccessNum;
			if (this._sBatchID && this._checkIfWholeBatchIsSelected()) {
				this._oPage.setBusy(true);
				this._handleMassActionInBatch(A);
			} else {
				this._oPage.setBusy(true);
				this._handleActionInSelectedHeldDocuments(A, this._aSelectedUnpostedEntries);
			}
		},
		_checkIfWholeBatchIsSelected: function () {
			if (this._aSelectedIndices.length === this._oHeldDocTable.getBinding("rows").getLength()) {
				return true;
			}
			var A = true;
			for (var i = 0; i < this._iUploadedEntriesNum; i++) {
				if (this._oHeldDocTable.getContextByIndex(i).getProperty("TemporaryId") !== "") {
					if (!this._oHeldDocTable.getPlugins()[0].isIndexSelected(i)) {
						A = false;
					}
				}
			}
			return A;
		},
		_getTmpNameOfHeldDoc: function (p) {
			var b = this._oHeldDocTable.getBinding("rows").getLength();
			for (var i = 0; i < b; i++) {
				var k = this._oHeldDocTable.getContextByIndex(i).getProperty("ParentDraftKey");
				k = k.replace(/-/g, "");
				if (k.toLocaleUpperCase() === p.toLocaleUpperCase()) {
					var n = this._oHeldDocTable.getContextByIndex(i).getProperty("TemporaryId");
					if (!n) {
						n = this._oHeldDocTable.getContextByIndex(i).getProperty("AccountingDocument");
					}
					return n;
				}
			}
			return "";
		},
		_catenateErrorMsg: function (t, m) {
			var T, i;
			if (t && t.indexOf("HoldDocumentKey") !== -1) {
				i = t.indexOf("HoldDocumentKey");
				var p = t.slice(i + 17, i + 49);
				T = this._getTmpNameOfHeldDoc(p);
				if (T) {
					T += ": ";
				}
				T += m;
			} else if (t && t.indexOf("TemporaryID") !== -1) {
				i = t.indexOf("TemporaryID");
				var l = t.length;
				T = t.slice(i + 13, l - 2);
				if (T.length === 3) {
					T = this.getResourceBundle().getText("DocumentSequence") + " " + T;
				}
				T += ": " + m;
			} else {
				T = m;
			}
			return T;
		},
		_showActionFinishInfoMsgBox: function (A) {
			var n = this._iPostEntryNum.toString();
			var N = this._iPostSuccessNum.toString();
			var s = this._iPostErrorNum.toString();
			var m, b, c;
			if (this._iPostWarningNum > 0) {
				var d = this._iPostWarningNum.toString();
				if (A === C.ACTION_TYPE_SUBMIT) {
					m = "SubmitContainWarning";
					c = this.getResourceBundle().getText("IgnoreSubmit");
				} else {
					m = "PostContainWarning";
					c = this.getResourceBundle().getText("IgnorePost");
				}
				b = this.getResourceBundle().getText(m, [n, N, s, d]);
				var t = this;
				sap.m.MessageBox.show(b, {
					title: this.getResourceBundle().getText("Warning"),
					icon: sap.m.MessageBox.Icon.WARNING,
					actions: [c, sap.m.MessageBox.Action.CANCEL],
					onClose: function (o) {
						if (o === c) {
							t._IgnoreWarningAction(A);
						} else if (o === sap.m.MessageBox.Action.CANCEL) {
							return;
						}
					}
				});
			} else {
				if (A === C.ACTION_TYPE_SUBMIT) {
					m = "SubmittedMsgBox";
				} else {
					m = "PostedMsgBox";
				}
				b = this.getResourceBundle().getText(m, [N, n]);
				if (this._iPostErrorNum > 0) {
					b += "\n";
					b += this.getResourceBundle().getText("PostContainError", s.toString());
				}
				sap.m.MessageBox.information(b);
			}
		},
		_checkHeldGUIDMassActionFinish: function (A) {
			if (this._iPostTotalNum <= 0) {
				this._bUseOldFilter = true;
				this._bShowPostMsgStrip = true;
				this._oHeldDocSmartTable.rebindTable();
				this._bShowActionFinishInfoMsgBox = true;
				this._sActionType = A;
				this._bIsInitialUpload = false;
				this._bNeedClearSelection = true;
				this._oPage.setBusy(false);
			} else {
				jQuery.sap.delayedCall(50, this, this._checkHeldGUIDMassActionFinish, [A]);
			}
		},
		_hideMessageStrip: function () {
			if (this._oMessageStrip) {
				this._oMessageStrip.setVisible(false);
			}
		},
		_insertMessageStrip: function (m, s) {
			var v = this.byId("sap.fin.gl.journalentry.upload.UploadPage.MessageStripVbox");
			if (this._oMessageStrip) {
				this._oMessageStrip.setText(m);
				this._oMessageStrip.setVisible(true);
				this._oMessageStrip.setType(s);
			} else {
				var l = this.getResourceBundle().getText("ShowLog");
				this._oMessageStrip = new sap.m.MessageStrip({
					text: m,
					type: s,
					showIcon: true,
					showCloseButton: true,
					visible: true,
					link: new sap.m.Link({
						text: l,
						press: jQuery.proxy(this.fnShowErrorList, this)
					})
				});
				this._oMessageStrip.attachClose(undefined, this.onMessageStripClosed, this);
			}
			if (v) {
				v.setVisible(true);
				v.insertItem(this._oMessageStrip, 1);
			}
		},
		fnShowErrorList: function () {
			this.onShowLogButtonPressed();
		},
		_showMessageList: function () {
			this.getRouter().navTo("message");
		},
		_resetFilterStatus: function () {
			var c = this._oHeldDocTable.getColumns();
			var l = c.length;
			for (var i = 0; i < l; i++) {
				if (c[i].getFiltered()) {
					c[i].setFiltered(false);
					this._oHeldDocTable.filter(c[i], null);
				}
			}
		},
		_createBatchIdDateFilter: function () {
			var r;
			var b = new F("BatchId", a.NE, "");
			if (this._sBatchID) {
				r = new F([new F("BatchId", a.EQ, this._sBatchID), b], true);
			} else if (this._sDateFrom && this._sDateTo) {
				r = new F([new F("CreationDateTime", a.GE, this._sDateFrom), new F("CreationDateTime", a.LE, this._sDateTo), b], true);
			} else {
				r = b;
			}
			return r;
		},
		_showNavigationPopover: function (n, A, e, p) {
			var c = this.getOwnerComponent();
			var h = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation").hrefForExternal(n, c);
			var l = new sap.ui.comp.navpopover.LinkData({
				text: A.getText(),
				href: h
			});
			e.actions = [l];
			this._oPage.setBusy(false);
			if (p) {
				e.show(undefined, e.mainNavigation, e.actions);
			} else {
				e.show(undefined, l, e.actions, undefined);
			}
		},
		_storeUploadPageState: function () {
			this.oRouter.detachRouteMatched(this.onRouteMatched, this);
			var i = this._generateAppState();
			var p = this.storeCurrentAppState(i);
			p.then(jQuery.proxy(function (A) {
				this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			}, this), jQuery.proxy(function (e) {
				this.oRouter.attachRouteMatched(this.onRouteMatched, this);
				this._handleError(e);
			}, this));
		},
		_isSubmitProcess: function () {
			var s = window.location.href;
			var u = sap.ushell.Container.getService("URLParsing");
			var b = "";
			if (s && u) {
				b = u.getShellHash(s);
			}
			if (b.indexOf("AccountingDocument-uploadGLDocforSubmit") > -1) {
				return true;
			}
		},
		_getSelectedIndices: function () {
			if (this._oHeldDocTable) {
				return this._oHeldDocTable.getPlugins()[0].getSelectedIndices();
			}
			return 0;
		},
		_convertAllDocumentID2String: function () {
			var d = [];
			var b = this._getSelectedIndices();
			for (var i = 0; i < b.length; i++) {
				var c = this._oHeldDocTable.getContextByIndex(b[i]);
				var s = c.getProperty("BatchId");
				var D = c.getProperty("DocumentSequence");
				var e = s + "_" + D;
				d.push(e);
			}
			if (d.length > 0) {
				return d.join(",");
			}
		},
		_confirmItemCount: function () {
			this._oPage.setBusy(true);
			var p = new jQuery.Deferred();
			var c = jQuery.proxy(function (D) {
				var i = D.GetHoldDocumentItemCount.ItemCount;
				if (i <= C.MAXIMUM_ALLOWED_ENTRIES) {
					p.resolve();
				} else {
					p.reject();
				}
			});
			var d = this._convertAllDocumentID2String();
			this.getOwnerComponent().getModel().callFunction("/GetHoldDocumentItemCount", {
				method: "GET",
				urlParameters: {
					HoldDocumentID: d
				},
				success: c
			});
			return p.promise();
		},
		_doPostSubmit: function (A, d) {
			var p = this._confirmItemCount();
			var t = this;
			p.then(A).fail(function () {
				sap.m.MessageBox.warning(t.getResourceBundle().getText("MaximumEntriesLimitationWarning", d), {
					actions: [d, sap.m.MessageBox.Action.CANCEL],
					emphasizedAction: d,
					onClose: function (s) {
						if (d === s) {
							A();
						} else {
							t._oPage.setBusy(false);
						}
					}
				});
			});
		}
	});
});