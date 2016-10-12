/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       06 Sep 2016     Chan
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){
	if(request.getMethod() === 'GET') {
		var form = nlapiCreateForm('Collection Letter');

        form.addSubmitButton('Send Email');
        form.addButton('custpage_cancel','Cancel', 'setWindowChanged(window, false); history.back();');

		var collectionSublist = form.addSubList('collection_list', 'list','Collection List');
		collectionSublist.addField('collection_list_apply', 'checkbox', 'Apply');
		collectionSublist.addField('collection_list_internalid', 'text', 'Internal ID');
        collectionSublist.addField('collection_list_trandate', 'text', 'Transaction Date');
        collectionSublist.addField('collection_list_customer', 'text', 'Customer');
        collectionSublist.addField('collection_list_daysopen', 'text', 'Days Open by Contract Date');
        collectionSublist.addField('collection_list_overdue', 'text', 'Days Overdue');
		var invoiceSearch = nlapiSearchRecord("invoice",null,
				[
				   ["type","anyof","CustInvc"],
				   "AND",
				   ["mainline","is","T"],
				   "AND",
				   ["status","anyof","CustInvc:A"],
				   "AND",
				   [["formulanumeric: TO_DATE({today})-TO_DATE({startdate})", "greaterthan", "60"],"AND",["daysoverdue","greaterthan","45"]],
				   "AND",
				   ["type","anyof","CustInvc"]
				],
				[
				   new nlobjSearchColumn("trandate",null,null),
				   new nlobjSearchColumn("startdate",null,null),
				   new nlobjSearchColumn("custbody_tran_term_in_months",null,null),
				   new nlobjSearchColumn("entity",null,null),
				   new nlobjSearchColumn("amount",null,null),
				   new nlobjSearchColumn("formulanumeric",null,null).setFormula("TO_DATE({today})-TO_DATE({startdate})"),
				   new nlobjSearchColumn("daysopen",null,null),
				   new nlobjSearchColumn("daysoverdue",null,null),
				   new nlobjSearchColumn("salesrep","createdFrom",null),
				   new nlobjSearchColumn("custentity_ta_invoice_email_address","customerMain",null)
				]
		);



		if(invoiceSearch) {
			invoiceSearch.forEach(function(record, index) {
				collectionSublist.setLineItemValue('collection_list_internalid', index+1, record.getId());
                collectionSublist.setLineItemValue('collection_list_trandate',index+1, record.getValue('trandate'));
                collectionSublist.setLineItemValue('collection_list_customer', index+1, record.getText('entity'));
                collectionSublist.setLineItemValue('collection_list_daysopen', index+1, record.getValue('formulanumeric'));
                collectionSublist.setLineItemValue('collection_list_overdue', index+1, record.getValue('daysoverdue'));
			});
		}

		response.writePage(form);
	}
	// POST
	else {
		var letterCount = request.getLineItemCount('collection_list');
		nlapiLogExecution('DEBUG', 'Letter Count', letterCount);
		
		// Loop through each one and send email
		for(var i = 1; i <= letterCount; i++) {
			var isApplied = request.getLineItemValue('collection_list', 'collection_list_apply', i);
			
			if(isApplied == 'T') {
				var invoiceId = request.getLineItemValue('collection_list', 'collection_list_internalid', i);
				nlapiLogExecution('DEBUG', 'Invoice ID', invoiceId);
			}
		}
		
	}





}
