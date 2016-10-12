/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 May 2015     Dana
 *
 */
function getPostTNL_AttInfo(){
	
	//Get attendee info and return as JSON object
	var attInfoJSON = [];
	var cuidARR = [];
	//First Get all attendees that passed - passFail = 'YES' then 'NO'
	var passFail = ['YES','NO'];
	for (var r in passFail){
		var passFils = [];
		passFils.push(new nlobjSearchFilter('custrecord_cpe_qualified',null,'is',passFail[r]));
		var passResults = ccerpSavedSearchUISearchRecord('customrecord_eventreg', passFils, null, 'customsearch__tnl_postevent_processing');
		if (isNotEmpty(passResults)){
			
			nlapiLogExecution('debug','passResults.length',passResults.length);
			for (var i = 0; i<passResults.length; i++){
				var cuid = passResults[i].getValue('custrecord_eventreg_cuid');
				nlapiLogExecution('debug','cuid',cuid);
				nlapiLogExecution('debug','cuidARR',JSON.stringify(cuidARR));
				var recId = passResults[i].getId();
				nlapiLogExecution('debug','recId', recId);
				nlapiSubmitField('customrecord_eventreg',recId,'custrecord_posteventproc_complete','T');
				if (isEmpty(cuid) || cuidARR.indexOf(cuid)>-1){
					continue;
				}
				var cuCust = passResults[i].getValue('custrecord_contractuser_customer','custrecord_eventreg_cuid');
				nlapiLogExecution('debug','cuCust '+cuCust);
				var bulkCerts = MyParseFloat(nlapiLookupField('customer',cuCust,'custentity_tnl_credit_remaining'));
				var billtype = passResults[i].getValue('custrecord_eventreg_billingtype');
				var chargeCust = passResults[i].getValue('custrecord_contractuser_chargecustomer','custrecord_eventreg_cuid');
				var ccid = passResults[i].getValue('custrecord_eventreg_ccid');
				var showtitle = passResults[i].getValue('custrecord_eventreg_showtitle');
				var polls = MyParseFloat(passResults[i].getValue('custrecord_eventatt_answeredpolls'));
				var mins = MyParseFloat(passResults[i].getValue('custrecord_eventatt_liveminutes'));
				var attendedlive = passResults[i].getValue('custrecord_eventatt_attendedlive');
				var contact = passResults[i].getValue('custrecord_regatt_contact');
				var subjectTxt = 'Tax Notes Live - '+showtitle+': CE Certificate';
				if (isNotEmpty(cuid)){
					nlapiLogExecution('debug','cuid processing',cuid);
					cuidARR.push(cuid);
				}
				attInfoJSON.push({
					"cuCust" : cuCust,
					"bulkCerts" : bulkCerts,
					"cuid" : cuid,
					"recId" : recId,
					"billtype" : billtype,
					"chargeCust" : chargeCust,
					"ccid" : ccid,
					"polls" : polls,
					"mins" : mins,
					"attendedlive" : attendedlive,
					"contact" : contact,
					"subjectTxt" : subjectTxt
					});
			}
		}	
	}
	return attInfoJSON;
}
function ccerp_Post_TNLevent_SCHED() {
	/* Post TNL event logic to handle 5 different use cases.
	 * 1 - Requested CPE and qualified for CPE (Credit Card bill)
	 * 2 - Requested CPE and qualified for CPE (Company bill)
	 * 3 - Requested CPE and did not qualify for CPE (Credit card bill)
	 * 4 - Requested CPE and did not qualify for CPE (Company bill)
	 * 5 - Requested CPE and did not attend (Credit card bill)
	 * 6 - Credit Card Failed
	 */
	//var zip = new JSZip();
	var attInfo = getPostTNL_AttInfo();
	if (isNotEmpty(attInfo)){
	// First Get Array of unique customer/bulkCert info
		var bulkCertArr = [];
		for (var bc in attInfo){
			var cuCustId = attInfo[bc].cuCust;
			var bulkCert = MyParseFloat(attInfo[bc].bulkCerts);
			nlapiLogExecution('debug','bulkCertCount '+bulkCert+'bc '+bc);
			if (bulkCert > 0 && _.findIndex(bulkCertArr, {cuCust:cuCustId})==-1){
				bulkCertArr.push({
					"cuCust" : cuCustId,
					"bulkCert" : bulkCert
				});
			}
			nlapiLogExecution('debug','bulkCertArr',JSON.stringify(bulkCertArr));
		}
		var mergeTemplate = '';
		for (var v in attInfo){
			var cuCustId = attInfo[v].cuCust;
			var cuid = attInfo[v].cuid;
			var recId = attInfo[v].recId;
			var attachments = [];
			nlapiLogExecution('debug','recId',recId);
			var billtype = attInfo[v].billtype;
			var chargeCust = attInfo[v].chargeCust;
			var ccid = attInfo[v].ccid;
			var polls = MyParseFloat(attInfo[v].polls);
			var mins = MyParseFloat(attInfo[v].mins);
			var attendedlive = attInfo[v].attendedlive;
			var contact = attInfo[v].contact;
			var subjectTxt = attInfo[v].subjectTxt;
			var pass = false;
			if (isNotEmpty(cuid)){
				nlapiLogExecution('debug','cuid processing',cuid);
				if (polls >= 3 && mins >= 50 && attendedlive == 'T'){
					if (billtype == 'TNLCC' && isNotEmpty(chargeCust)){ //1 - Requested CPE and qualified for CPE (Credit Card bill)
						subjectTxt += ' and Receipt';
						//Create Cash Sale for Charge customer
						var cashsale = nlapiCreateRecord('cashsale',{customform : '162',entity : chargeCust});
						cashsale.selectNewLineItem('item');
						cashsale.setCurrentLineItemValue('item','item',2070);
						cashsale.setCurrentLineItemValue('item','revrecschedule','');
						cashsale.commitLineItem('item');
						cashsale.setFieldValue('creditcard',ccid);
						var csid = nlapiSubmitRecord(cashsale);
						var status = nlapiLookupField('cashsale',csid,'status');
						nlapiLogExecution('debug','status',status);
						if (status == 'notDeposited'){
							pass = true;
							var csfileObj= nlapiPrintRecord('transaction', csid, 'PDF');
							attachments.push(csfileObj);
							mergeTemplate = '18';
						}
						else{ //6 - Credit Card Failed
							mergeTemplate = '22';
							nlapiSubmitField('customrecord_eventreg',recId,'custrecord_eventatt_ccfailed','T');
						}
					}
					if (billtype == 'TNLCB' ){ //2 - Requested CPE and qualified for CPE (Company bill)
						var bulkCertARRIndex = _.findIndex(bulkCertArr, {cuCust:cuCustId});
						nlapiLogExecution('debug','bulkCertARRIndex '+bulkCertARRIndex);
						if (bulkCertARRIndex > -1){
							var bulkCertAvail = bulkCertArr[bulkCertARRIndex].bulkCert;
							if (bulkCertAvail>0){
								bulkCertArr.splice(bulkCertARRIndex,1,{"cuCust":cuCustId,"bulkCert" : bulkCertAvail-1});
								nlapiSubmitField('customrecord_eventreg',recId,'custrecord_isbulkcertificate','T');
								mergeTemplate = '18';
								pass = true;
							}
						}
						else{
							mergeTemplate = '18';
							pass = true;
						}
					}
					if (billtype == 'TNLFREE'){
						mergeTemplate = '23';
						pass = true;
					}
				}
				/*else if (attendedlive != 'T' && attendedarch !='T'){ //5 - Requested CPE and did not attend (Credit card bill)
					 	mergeTemplate = '22';
				}*/
				else{	
					if (billtype == 'TNLCC'){ //3 - Requested CPE and did not qualify for CPE (Credit card bill)
						mergeTemplate = '21';
					}
					if(billtype == 'TNLCB'){ //4 - Requested CPE and did not qualify for CPE (Company bill)
						mergeTemplate = '20';
					}
					if(billtype == 'TNLFREE'){ //4 - Requested CPE and did not qualify for CPE (TNLFREE)
						mergeTemplate = '25';
					}
				}	
			}
			if (pass == true){
			//create certification PDF
				var fileObj = nlapiMergeRecord(26,'customrecord_eventreg',recId);
				var filevalue = fileObj.getValue();
				var certpdfobj = nlapiCreateFile('TNL_Cert'+recId+'.pdf', 'PDF', filevalue);
				attachments.push(certpdfobj);
			}	
			var author = 92599;
	        var recipient = contact;
        	if (isNotEmpty(mergeTemplate) && isNotEmpty(recipient)){
        		var merge = nlapiMergeRecord(mergeTemplate, 'customrecord_eventreg', recId); 
		        var subject = subjectTxt;
		        var body = merge.getValue();
		        var cc = [];
		        var bcc = [];
		        var records = new Object();
		        records['entity'] = recipient;
		        records['record'] = recId;
		        records['recordtype'] = 'customrecord_eventreg';
		        nlapiSendEmail(author, recipient, subject, body, cc, bcc, records, attachments);
		       
		        //Search for the email and Delete the Cert PDF Attachment
		        var messageFils = [];
		        var messageCols = [];
		        messageFils.push(new nlobjSearchFilter('author',null,'is',author));
		        messageFils.push(new nlobjSearchFilter('name','attachments','is','TNL_Cert'+recId+'.pdf'));
		        messageCols.push(new nlobjSearchColumn('internalid','attachments'));
		        var msgResults = nlapiSearchRecord('message',null,messageFils,messageCols);
		        if (isNotEmpty(msgResults)){
		        	nlapiLogExecution('debug','msgResults.length '+msgResults.length);
		        	for (var f = 0; f<msgResults.length; f++){
		        		var fileId = msgResults[f].getValue('internalid','attachments');
		        		nlapiDeleteFile(fileId);	
		        	}
		        }
        	}
		}
		//update bulk Certificate on customer Record
		for (var cu in bulkCertArr){
			nlapiSubmitField('customer',bulkCertArr[cu].cuCust,'custentity_tnl_credit_remaining',bulkCertArr[cu].bulkCert);
		}
	}
}
