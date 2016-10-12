/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 Sep 2016     Chan
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function sendLetterScheduled(type) {
	var context = nlapiGetContext();
	var lastIndex = context.getSetting('SCRIPT', 'custscript_index') || 0;
	
	nlapiLogExecution('DEBUG', 'Last Index', lastIndex);
	
	var invoiceSearch = nlapiSearchRecord("invoice",null,
			[
			   ["type","anyof","CustInvc"], 
			   "AND", 
			   ["daysoverdue","greaterthan","400"], 
			   "AND", 
			   ["mainline","is","T"], 
			   "AND", 
			   ["status","anyof","CustInvc:A"], 
			   "AND", 
			   ["type","anyof","CustInvc"]
			], 
			[
			   new nlobjSearchColumn("internalid",null,null).setSort(false),
			   new nlobjSearchColumn("custbody_end_user",null,null), 
			   new nlobjSearchColumn("daysoverdue",null,null)
			]
			);
	
	if(invoiceSearch) {
		for(var index = 0; index < invoiceSearch.length; index++ ) {
			if((index+1) > lastIndex) {
				var LOOKUP_FIELDS = ['entity', 'salesrep', 'email', 'tranid'];
				var invoiceId = invoiceSearch[index].getId();
				var customerInfo = nlapiLookupField('invoice', invoiceId, LOOKUP_FIELDS);
				
				if(!customerInfo.email) {
					var billingEmail =  nlapiLookupField('customer', customerInfo.entity, 'email');
					var invoiceEmail = nlapiLookupField('customer', customerInfo.entity, 'custentity_ta_invoice_email_address');
					customerInfo.email = invoiceEmail || billingEmail;
				}
				
				if(customerInfo.email){
					var invoicePDF = nlapiPrintRecord('TRANSACTION', invoiceId, 'PDF');
					
					var subject = 'PAST DUE Invoice ' + customerInfo.tranid + ' from Tax Analysts'
					
					var body = 'Please find attached your invoice number ' + customerInfo.tranid + '.<br/>';
						body += 'If you have any questions, please contact us.<br/> Regards, <br/>';		
					
					var records = {};
					records.transaction = invoiceId;
					nlapiSendEmail(customerInfo.salesrep, customerInfo.email, subject, body, null, null, records, invoicePDF);
				}
			}
			nlapiLogExecution('DEBUG', 'Usage Remaining', context.getRemainingUsage());
			if(context.getRemainingUsage() <= 0  && (index + 1) < invoiceSearch.length) {
				var params = {};
				params.custscript_index = index;
				var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), params);
				if (status == 'QUEUED') break;
			}
		}
	}
}
