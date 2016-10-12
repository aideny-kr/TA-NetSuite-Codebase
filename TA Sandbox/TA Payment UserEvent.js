/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 May 2016     Chan
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function taPaymentAfterSubmit(type){
	if(type == 'create') {
		var customer_id = nlapiGetFieldValue('customer');
		var salesrep = nlapiLookupField('customer', customer_id, 'salesrep');
		var applied = +nlapiGetFieldValue('applied');
		if(salesrep && applied > 0) {
			var invoice_id = '';
			for(var i = 1; i <= nlapiGetLineItemCount('apply'); i += 1) {
					invoice_id = nlapiGetLineItemValue('apply', 'internalid', i) ;
			}
			var customer_name = nlapiLookupField('customer', customer_id, ['entityid', 'companyname']);
			var records = {};
			records['transaction'] = nlapiGetFieldValue('internalid');
			var subject = 'New Payment is Posted for a Customer';
			var body = 'This is just a quick notification that your customer ' + customer_name['entityid'] + ' ' + customer_name['companyname'] + ', ' + 'posted a payment.<br/>';
			body += 'The Payment Amount was $' + nlapiGetFieldValue('payment') + '.<br/>';
			if(nlapiLookupField('transaction', invoice_id, 'type') == 'CustInvc'){ 
				body += 'The payment was applied to <a href="https://system.sandbox.netsuite.com/app/accounting/transactions/custinvc.nl?id="'+ invoice_id +'>This Invoice. (Click here to access)</a>';
			}
			nlapiSendEmail('17629', salesrep, subject, body, null, null, records);
		}
	}
}
