/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Mar 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

/*
 * [item name, original rate, renewed rate]
 * 
 */

function suitelet(request, response){
	var form = nlapiCreateForm('Renewal Rate by Items', true);
	form.addSubmitButton('Generate Chart');
	
	// Get the first and last day of the month
	var date = new Date();
	var firstDay = nlapiDateToString(new Date(date.getFullYear(), date.getMonth(), 1), 'MM/DD/YYYY');
	var lastDay = nlapiDateToString(new Date(date.getFullYear(), date.getMonth()+1, 0), 'MM/DD/YYYY');
	
	var filters = [];
	filters.push( new nlobjSearchFilter('custrecord_contracts_end_date', null,'within', firstDay, lastDay) );
	
	var contract_src_result = nlapiSearchRecord(null, 'customsearch__item_renewal_rate_analysis', filters);
	
	if(contract_src_result){
		var array_to_submit = [];
		var items = [];
		for (var i = 0; i < contract_src_result.length; i += 1) {
			items.push(contract_src_result[i].getText('custrecord_ci_item', 'CUSTRECORD_CI_CONTRACT_ID', 'group'));
		}
		items = _.uniq(items);
		nlapiLogExecution('DEBUG', 'items array', JSON.stringify(items));
	}
	response.writePage(form);
}
