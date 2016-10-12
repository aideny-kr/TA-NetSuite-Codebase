/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       24 Feb 2016     Dana
 *
 */

/**
 * @param {String}  Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function CreateTNL_WebUser_SCHED() {
	var context = nlapiGetContext();
	var ciContract = context.getSetting('SCRIPT', 'custscript_wu_contractid');
	var itemId = context.getSetting('SCRIPT', 'custscript_wu_itemid');
	var customer = context.getSetting('SCRIPT', 'custscript_wu_customer');
	//Update all web users with TNL activation item
	nlapiLogExecution('debug','itemId '+itemId);
	itemId = itemId.split(',');
	var cuFils = [];
	var cuCols = [];
	cuFils.push(new nlobjSearchFilter('isinactive',null,'is','F'));
	cuFils.push(new nlobjSearchFilter('custrecord_contractuser_items',null,'noneof',itemId));
	cuFils.push(new nlobjSearchFilter('custrecord_contractuser_customer',null,'is',customer));
	cuCols.push(new nlobjSearchColumn('custrecord_contractuser_contract'));
	var cuResults = nlapiSearchRecord('customrecord_contractuser',null,cuFils,cuCols);
	if (isNotEmpty(cuResults)){
		for (var i = 0; i<cuResults.length;i++){
			var curec = '';
			var cuContract = cuResults[i].getValue('custrecord_contractuser_contract');
			var cuid = cuResults[i].getId();
			if (cuContract == ciContract){
				curec = nlapiLoadRecord('customrecord_contractuser',cuid);
				var itemsArr = curec.getFieldValues('custrecord_contractuser_items');
				if (isNotEmpty(itemsArr))
					itemsArr = itemsArr.concat(itemId);
				curec.setFieldValues('custrecord_contractuser_items',itemsArr);
			}
			else{
				curec = nlapiCopyRecord('customrecord_contractuser',cuid);
				curec.setFieldValues('custrecord_contractuser_items',itemId);
				curec.setFieldValue('custrecord_contractuser_contract',ciContract);
			}
			nlapiSubmitRecord(curec);
		}
		var params = [];
		params['custscript_wu_contractid'] = ciContract;
		params['custscript_wu_itemid'] = itemId;
		params['custscript_wu_customer'] = customer;
		verifyMetering(100, params);
	}
}
