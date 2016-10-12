/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       13 Aug 2015     Dana
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function Message_BeforeLoad(type, form, request){
	nlapiLogExecution('debug','Message_BeforeLoad '+type);
	//return;
	var context = nlapiGetContext();
	exeContext = context.getExecutionContext();
	
	if ((type == 'create') && exeContext == 'userinterface'){
		txnId = request.getParameter('transaction');
		if (isNotEmpty(txnId)){
			var txnType = nlapiLookupField('transaction',txnId,'type');
			if (txnType == 'Estimate'){
				appStatus = nlapiLookupField('transaction',txnId,'custbody_quoteapprovalstatus');
				if (appStatus != '2'){
					throw nlapiCreateError('ERROR','Estimate Not Approved',true);
				}
			}
		}
	}
}
