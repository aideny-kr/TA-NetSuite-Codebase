/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Mar 2015     Dana
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function ccerpGetCreditCardInfo_RESTlet(dataIn) {
	//var dataIn = JSON.parse(dataIn); Weird Behavior 
	// Creating err object
	var err = new Object();
	// Enable debugging Log Execution
	nlapiLogExecution('debug', 'ccerpGetCreditCardInfo_RESTlet', 'BEGIN '+dataIn.cuid);
	
	
	try {
		
		var chargecust = nlapiLookupField('customrecord_contractuser',dataIn.cuid,'custrecord_contractuser_chargecustomer');
		nlapiLogExecution('debug','chargecust ',+chargecust);
		var ccInfo = [];
		if (chargecust){
			var custrec = nlapiLoadRecord('customer',chargecust);
			var ccCount = custrec.getLineItemCount('creditcards');
			if (ccCount > 0){
				//for(var i = 1; i <= ccCount; i++){
					ccInfo.push({
						"cuid":dataIn.cuid,
						"ccid": custrec.getLineItemValue('creditcards','internalid',1),
						"cctype": custrec.getLineItemText('creditcards','paymentmethod',1),
						"ccnumber":custrec.getLineItemValue('creditcards','ccnumber',1).slice( -5 ),
						"ccexpiredate": custrec.getLineItemValue('creditcards','ccexpiredate',1)
					});
				//}
			}
		}
		else{
			
			// Search for web user with same email and charge to customer isNotEmpty
			// 
			// Look for contactId 
			var contactId = nlapiLookupField('customrecord_contractuser', dataIn.cuid, 'custrecord_contractuser_contact');
			nlapiLogExecution('DEBUG', 'contactId', contactId);
			var cuFlds = ['custrecord_contractuser_email','custrecord_contractuser_customer'];
			var cuVals = nlapiLookupField('customrecord_contractuser',dataIn.cuid,cuFlds);
			var email = cuVals['custrecord_contractuser_email'];
			var cuCustomer = cuVals['custrecord_contractuser_customer'];
			var cuFils = [];
			var cuCols = [];
			cuFils.push(new nlobjSearchFilter('custrecord_contractuser_email',null,'is',email));
			cuFils.push(new nlobjSearchFilter('custrecord_contractuser_contact', null, 'is', contactId));
			cuFils.push(new nlobjSearchFilter('custrecord_contractuser_chargecustomer',null,'noneof','@NONE@'));
			cuFils.push(new nlobjSearchFilter('custrecord_contractuser_activeflag',null,'is','T'));
			//cuFils.push(new nlobjSearchFilter('custrecord_contractuser_customer',null,'is',cuCustomer));
			cuCols.push(new nlobjSearchColumn('custrecord_contractuser_chargecustomer'));
			var curesults = nlapiSearchRecord('customrecord_contractuser',null,cuFils,cuCols);
			if (isNotEmpty(curesults)){
				var chargecust = curesults[0].getValue('custrecord_contractuser_chargecustomer');
				var cuid = curesults[0].getId();
				var custrec = nlapiLoadRecord('customer',chargecust);
				var ccCount = custrec.getLineItemCount('creditcards');
				if (ccCount > 0){
					//for(var i = 1; i <= ccCount; i++){
						ccInfo.push({
							"cuid" : cuid,
							"ccid": custrec.getLineItemValue('creditcards','internalid',1),
							"cctype": custrec.getLineItemText('creditcards','paymentmethod',1),
							"ccnumber":custrec.getLineItemValue('creditcards','ccnumber',1).slice( -5 ),
							"ccexpiredate": custrec.getLineItemValue('creditcards','ccexpiredate',1)
						});
					//}
				}
			}
		}
		
		var ccInfoJson = JSON.stringify(ccInfo);
		nlapiLogExecution('debug','ccInfoJson',ccInfoJson);
		return ccInfoJson;
	} 
	
	catch(e) {
		nlapiLogExecution('error', 'Exception', e);
		err.status = 'Fail';
		err.code = e.code;
		err.details = e.details;
		return err;
	}
}



