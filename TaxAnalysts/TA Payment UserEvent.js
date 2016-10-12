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
	// Send an email to Sales Rep. 
	// Email will be sent, if there is a new payment posted.
	if(type == 'create') {
		var customer_id = nlapiGetFieldValue('customer');
		var salesrep = nlapiLookupField('customer', customer_id, 'salesrep');
		if(salesrep) {
			var invoice_id = '';
			for(var i = 1; i <= nlapiGetLineItemCount('apply'); i += 1) {
					invoice_id = nlapiGetLineItemValue('apply', 'internalid', i) ;
			}
			var customer_name = nlapiLookupField('customer', customer_id, ['entityid', 'companyname']);
			var records = {};
			records['transaction'] = nlapiGetFieldValue('internalid');
			var subject = '[Notification] New Payment is Posted';
			var body = 'This is just a quick notification that your customer ' + customer_name['entityid'] + ' ' + customer_name['companyname'] + ', ' + 'posted a payment.<br/>';
			body += 'The amount processed was <strong>$' + nlapiGetFieldValue('payment') + '</strong><br/><br/>';
			if(nlapiLookupField('transaction', invoice_id, 'type') == 'CustInvc'){ 
				body += 'You may access the invoice which the payment was applied by clicking <a href="https://system.na1.netsuite.com/app/accounting/transactions/custinvc.nl?id='+ invoice_id +'">here (Invoice Record).</a>';
			}
			nlapiSendEmail('17629', salesrep, subject, body, null, null, records);
		}
	}
}
