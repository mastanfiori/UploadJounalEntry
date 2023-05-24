/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/core/util/MockServer"
	], function (MockServer) {
		"use strict";
		var oMockServer,
			_sAppModulePath = "fin/gl/journalentry/upload/",
			_sJsonFilesModulePath = _sAppModulePath + "localService/mockdata";

		return {

			/**
			 * Initializes the mock server.
			 * You can configure the delay with the URL parameter "serverDelay".
			 * The local mock data in this folder is returned instead of the real data for testing.
			 * @public
			 */
			init : function () {
				var oUriParameters = jQuery.sap.getUriParameters(),
					sJsonFilesUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath),
					sManifestUrl = jQuery.sap.getModulePath(_sAppModulePath + "manifest", ".json"),
					sEntity = "UploadedDocWorklistItems",
					sErrorParam = oUriParameters.get("errorType"),
					iErrorCode = sErrorParam === "badRequest" ? 400 : 500,
					oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
					oMainDataSource = oManifest["sap.app"].dataSources.mainService,
					sMetadataUrl = jQuery.sap.getModulePath(_sAppModulePath + oMainDataSource.settings.localUri.replace(".xml", ""), ".xml"),
					// ensure there is a trailing slash
					sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/";

				oMockServer = new MockServer({
					rootUri : sMockServerUrl
				});

				// configure mock server with a delay of 1s
				MockServer.config({
					autoRespond : true,
					autoRespondAfter : (oUriParameters.get("serverDelay") || 1000)
				});

				// load local mock data
				oMockServer.simulate(sMetadataUrl, {
					sMockdataBaseUrl : sJsonFilesUrl,
					bGenerateMissingMockData : true
				});

				var aRequests = oMockServer.getRequests(),
					fnResponse = function (iErrCode, sMessage, aRequest) {
						aRequest.response = function(oXhr){
							oXhr.respond(iErrCode, {"Content-Type": "text/plain;charset=utf-8"}, sMessage);
						};
					};
					
				aRequests.push({
					method: "POST",
	
					path: new RegExp(".*HoldDocumentPost.*"),
	
					response: function(oXhr) {
						return oXhr.respond(200, {
							"Content-Type": "application/json;charset=utf-8"
						}, JSON.stringify({
						    "d": {
						        "HoldDocumentPost": {
						            "NumberOfAcctgDocsWithErrors": "0",
						            "NumberOfAcctgDocsWithWarnings": "0",
						            "NumberOfPostedAcctgDocs": "1",
						            "__metadata": {
						                "type": "FAC_FINANCIALS_POSTING_SRV.HoldDocumentPostReturn"
						            }
						        }
						    }
						}));
					}
				});	
				
				aRequests.push({
					method: "POST",
	
					path: new RegExp(".*HoldDocumentPark.*"),
	
					response: function(oXhr) {
						return oXhr.respond(200, {
							"Content-Type": "application/json;charset=utf-8"
						}, JSON.stringify({
						    "d": {
						        "HoldDocumentPark": {
						            "NumberOfAcctgDocsWithErrors": "0",
						            "NumberOfAcctgDocsWithWarnings": "0",
						            "NumberOfParkedAcctgDocs": "1",
						            "__metadata": {
						                "type": "FAC_FINANCIALS_POSTING_SRV.HoldDocumentParkReturn"
						            }
						        }
						    }
						}));
					}
				});	
				
				aRequests.push({
					method: "POST",
	
					path: new RegExp(".*HoldDocumentRestore.*"),
	
					response: function(oXhr) {
						return oXhr.respond(200, {
							"Content-Type": "application/json;charset=utf-8"
						}, JSON.stringify({
						    "d": {
						        "HoldDocumentRestore": {
						            "TmpIdType": "T",
						            "TmpId": "YB2S8QTAUR",
						            "__metadata": {
						                "type": "FAC_FINANCIALS_POSTING_SRV.AcctgDocTmpKey"
						            }
						        }
						    }
						}));
					}
				});	
				
				aRequests.push({
					method: "GET",
	
					path: new RegExp(".*GetHoldDocumentItemCount.*"),
	
					response: function(oXhr) {
						return oXhr.respond(200, {
							"Content-Type": "application/json;charset=utf-8"
						}, JSON.stringify({
							"d": {
								"GetHoldDocumentItemCount": {
									"__metadata": {
										"type": "FAC_FINANCIALS_POSTING_SRV.HoldDocumentCount"
									},
									"HeaderCount": 1,
									"ItemCount": 2
								}
							}
						}));
					}
				});	

				// handling the metadata error test
				if (oUriParameters.get("metadataError")) {
					aRequests.forEach( function ( aEntry ) {
						if (aEntry.path.toString().indexOf("$metadata") > -1) {
							fnResponse(500, "metadata Error", aEntry);
						}
					});
				}

				// Handling request errors
				if (sErrorParam) {
					aRequests.forEach( function ( aEntry ) {
						if (aEntry.path.toString().indexOf(sEntity) > -1) {
							fnResponse(iErrorCode, sErrorParam, aEntry);
						}
					});
				}
				
				oMockServer.setRequests(aRequests);
				
				oMockServer.start();

				jQuery.sap.log.info("Running the app with mock data");
			},

			/**
			 * @public returns the mockserver of the app, should be used in integration tests
			 * @returns {sap.ui.core.util.MockServer} the mockserver instance
			 */
			getMockServer : function () {
				return oMockServer;
			}
		};

	}
);