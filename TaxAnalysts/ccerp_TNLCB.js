/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Aug 2015     huichanyi
 *
 */

/*
{
    "Customer": "customer",
    "Lines": [{
            "attended": [{
                    "date": "Formula(date)",
                    "Quantity": [
                        {"Qty": "cuidCount"
                        }
                    ]
                }
            ]
        }
    ]
}
*/


// 1. Create Suitelet to call Scheduled Script
	// a. Run search to validate if there is any Qualified TNLCB webuser 
	// redirect the user to status page 

function ta_TNLCB_Suitelet(request, response) {
	
	nlapiLogExecution('debug','START');
	var searchFilter = new Array();
	//searchFilter.push(new nlobjSearchFilter('custrecord_eventreg_billingtype', null, 'is', 'TNLCB'));
	searchFilter.push(new nlobjSearchFilter('custrecord_cpe_qualified', null, 'is', 'YES'));
	var validateResult = nlapiSearchRecord(null, 'customsearch__tnlcb_monthend_processing',searchFilter);
	if(isNotEmpty(validateResult)){
		nlapiLogExecution('debug','validateResult '+validateResult);
		var params = [];
		params['primarykey']='1257';
		params['date']='TODAY';
		params['scripttype']='215';
		var schedScript = nlapiScheduleScript('customscript_ta_tnlcb_month_end_sched', 'customdeploy1');
		if(schedScript != null){
		nlapiSetRedirectURL('TASKLINK','LIST_SCRIPTSTATUS',null,null,params);
		}
	}
}


// 2. In Scheduled Script run search for customsearch__tnlcb_monthend_processing
	// a. create invoice for each Web User: Contract Customer
	// b. In 'item' sublist, set item to TNLCB item 2070.   

function TNLCB_Month_End_SCHED(){
	nlapiLogExecution('debug','shced running');
	//Set Up JSON object
	/*var cuidArr = [];
	var TNLCB_JSON = [{
	    "Customer": "",
	    "Lines": [{
	            "attended": [{
	                    "date": "",
	                    "Quantity" : cuidArr
	                }
	            ]
	        }
	    ]
	}];
	*/
	var TNLCB_results = ccerpSavedSearchUISearchRecord('customrecord_eventreg', null, null, 'customsearch__tnlcb_monthend_processing');
	if (isNotEmpty(TNLCB_results)){
		for (var i = 0; i<TNLCB_results.length;i++){
			var columns = TNLCB_results[i].getAllColumns();
			//return;
			var customer = TNLCB_results[i].getValue('custrecord_contractuser_customer','custrecord_eventreg_cuid','group');
			nlapiLogExecution('debug','custID '+customer);
			var regattARR = [];
			var regattProcessedARR = [];
			var regattEmailsARR = [];
			var regattIds = TNLCB_results[i].getValue(columns[3]).split(',');
			var regattEmail = TNLCB_results[i].getValue(columns[4]).split(',');
			//var isBulkCert = TNLCB_results[i].getValue(columns[5]).split(',');
			//nlapiLogExecution('debug','regattEmail',regattEmail);
			for (var regattId in regattIds){
				if (regattEmailsARR.indexOf(regattEmail[regattId]) == -1){
					regattEmailsARR.push(regattEmail[regattId]);
					regattARR.push(regattIds[regattId]);
				}
				else{
					regattProcessedARR.push(regattIds[regattId]);
				}
			}
			var nextCust = '';
			if (i+1 < TNLCB_results.length)
				nextCust = TNLCB_results[i+1].getValue('custrecord_contractuser_customer','custrecord_eventreg_cuid','group');
			var invrec = nlapiCreateRecord('invoice');
			invrec.setFieldValue('custbody_end_user',customer);
			invrec.setFieldValue('entity',customer);
			invrec.setFieldValue('custbody_order_type',1);
			var attended = TNLCB_results[i].getValue('formuladate',null,'group');
			var Quantity = TNLCB_results[i].getValue('custrecord_eventreg_email',null,'count');
			var isBulkCert = TNLCB_results[i].getValue('custrecord_isbulkcertificate',null,'max');
			invrec.selectNewLineItem('item');
			if (isBulkCert == 'T'){
				var rate = 0;
				invrec.setCurrentLineItemValue('item','item',2070);
				invrec.setCurrentLineItemValue('item','price',-1);
				invrec.setCurrentLineItemValue('item','rate',rate);
			}
			else{
				invrec.setCurrentLineItemValue('item','item',2070);
			}
			invrec.setCurrentLineItemValue('item','quantity',Quantity);
			invrec.setCurrentLineItemValue('item','description',attended);
			invrec.commitLineItem('item');
			nlapiLogExecution('debug','results.length',TNLCB_results.length);
			while (nextCust == customer){
				var whileregattEmailsARR = [];
				i++;
				if (i < TNLCB_results.length){
					nlapiLogExecution('debug','whileregattEmailsARR',JSON.stringify(whileregattEmailsARR));
					var regattIds = TNLCB_results[i].getValue(columns[3]).split(',');
					var regattEmail = TNLCB_results[i].getValue(columns[4]).split(',');
					for (var regattId in regattIds){
						if (whileregattEmailsARR.indexOf(regattEmail[regattId]) == -1){
							whileregattEmailsARR.push(regattEmail[regattId]);
							regattARR.push(regattIds[regattId]);
						}
						else{
							regattProcessedARR.push(regattIds[regattId]);
						}
					}
					var attended = TNLCB_results[i].getValue('formuladate',null,'group');
					var Quantity = TNLCB_results[i].getValue('custrecord_eventreg_email',null,'count');
					var isBulkCert = TNLCB_results[i].getValue('custrecord_isbulkcertificate',null,'max');
					invrec.selectNewLineItem('item');
					if (isBulkCert == 'T'){
						var rate = 0;
						invrec.setCurrentLineItemValue('item','item',2070);
						invrec.setCurrentLineItemValue('item','price',-1);
						invrec.setCurrentLineItemValue('item','rate',rate);
					}
					else{
						invrec.setCurrentLineItemValue('item','item',2070);
					}
					invrec.setCurrentLineItemValue('item','quantity',Quantity);
					invrec.setCurrentLineItemValue('item','description',attended);
					invrec.commitLineItem('item');
					if (i+1 < TNLCB_results.length)
						nextCust = TNLCB_results[i+1].getValue('custrecord_contractuser_customer','custrecord_eventreg_cuid','group');
				}
				else{
					i--;
					break;
				}
			}
			nlapiLogExecution('debug','regattEmailsARR',JSON.stringify(regattEmailsARR));
			nlapiLogExecution('debug','regattARR',JSON.stringify(regattARR));
			nlapiLogExecution('debug','regattProcessedARR',JSON.stringify(regattProcessedARR));
			//Submit invoice and update RegAtt with inid
			var inid = nlapiSubmitRecord(invrec);
			nlapiLogExecution('debug','inid'+inid);
			for (var ra in regattARR){
				var regattARRFlds = ['custrecord_eventatt_tnlcbinvoice','custrecord_tnlcbmonthendcomplete'];
				nlapiSubmitField('customrecord_eventreg',regattARR[ra],regattARRFlds,[inid,'T']);
			}
			for (var rap in regattProcessedARR){
				nlapiSubmitField('customrecord_eventreg',regattProcessedARR[rap],'custrecord_tnlcbmonthendcomplete','T');
			}
			//Create CSV file to be attached to email to customer.
			var regAttSearchFils = [];
			regAttSearchFils.push(new nlobjSearchFilter('internalid','custrecord_eventatt_tnlcbinvoice','is',inid));
			regAttSearch = nlapiSearchRecord('customrecord_eventreg', 'customsearch__tnlcb_monthend_export', regAttSearchFils);
			
			if (isNotEmpty(regAttSearch)){
				function escapeCSV(val) {
					if (!val)
						return '';
					if (!(/[",\s]/).test(val))
						return val;
					val = val.replace(/"/g, '""');
					return '"' + val + '"';
				}

				function makeHeader(firstLine) {
					var cols = firstLine.getAllColumns();
					var hdr = [];
					cols.forEach(function(c) {
						var lbl = c.getLabel(); // column must have a custom label to be
												// included.
						if (lbl) {
							hdr.push(escapeCSV(lbl));
						}
					});
					return hdr.join();
				}

				function makeLine(srchRow) {
					var cols = srchRow.getAllColumns();
					var line = [];
					cols.forEach(function(c) {
						if (c.getLabel()) {
							line.push(escapeCSV(srchRow.getText(c)
									|| srchRow.getValue(c)));
						}
					});
					return line.join();
				}

				function getDLFileName(prefix) {
					function pad(v) {
						if (v >= 10)
							return v;
						return "0" + v;
					}
					var now = new Date();
					return inid+prefix + '-' + now.getFullYear() + pad(now.getMonth() + 1)
							+ pad(now.getDate()) + pad(now.getHours())
							+ pad(now.getMinutes()) + ".csv";
				}

				var srchRows = regAttSearch; // function that returns your saved search
											// results
				if (!srchRows)
					throw nlapiCreateError("SRCH_RESULT", "No results from search",
							true);

				var fileLines = [ makeHeader(srchRows[0]) ];

				srchRows.forEach(function(batLine) {
					fileLines.push(makeLine(batLine));
				});

				var content = fileLines.join('\r\n');
				var file = nlapiCreateFile(customer+' inv '+inid,'CSV',content);
				file.setFolder(733);
				var fileId = nlapiSubmitFile(file);
				nlapiAttachRecord('file',fileId,'invoice',inid);
				
			}	
		}
	}
}