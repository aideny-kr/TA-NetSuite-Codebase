/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Jan 2016     Chan
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */


function postRESTlet(dataIn) {
/* {
 * 	entity_number : 1234,
 * 	invoice_number : 12345
 * }
 * */
	var err = {};	
	if(dataIn.action == 'find_invoice'){
		nlapiLogExecution('DEBUG', 'dataIn for getRESTlet', JSON.stringify(dataIn));
		
		if (!dataIn.entity_number || !dataIn.invoice_number) {
			err.status = 'fail';
			err.code = 'Missing Required Field';
			err.details = 'entity_number or invoice_number';
			return err;
		}
		
		var find_inv_filters = [ new nlobjSearchFilter('entityid', 'customer', 'is', dataIn.entity_number),
		                        new nlobjSearchFilter('tranid', null, 'is', dataIn.invoice_number),
		                        new nlobjSearchFilter('status', null, 'anyof', 'CustInvc:A'),
		                        new nlobjSearchFilter('mainline', null, 'is', 'T')
		                        ];
		var find_inv_columns = [ new nlobjSearchColumn('amountremaining'), new nlobjSearchColumn('internalid'), new nlobjSearchColumn('tranid'), new nlobjSearchColumn('internalid', 'customer'), 
		                         new nlobjSearchColumn('companyname', 'customer')];
		
		var result = nlapiSearchRecord('invoice', null, find_inv_filters, find_inv_columns);
		if(isNotEmpty(result)){
			var inv_obj = {};
			inv_obj.status = 'success';
			inv_obj.invoice = [];
			for(var i = 0; i < result.length; i++){
				var prop = {};
				prop.invoice_id = result[i].getValue('internalid');
				prop.amount = result[i].getValue('amountremaining');
				prop.tran_id = result[i].getValue('tranid');
				prop.cust_id = result[i].getValue('internalid', 'customer');
				prop.cust_name = result[i].getValue('companyname', 'customer');
				inv_obj.invoice.push(prop);
			}
			
			return inv_obj;
		}else{
			err.status = 'fail';
			err.code = 'E2';
			err.details = 'No Invoice was Found';
			return err;
				
		}
	}
	
	// If dataIn has action value 'charge' then trasform invoice record into customer payment record
	
	else if(dataIn.action == 'charge'){
		nlapiLogExecution('DEBUG', 'dataIn for getRESTlet', JSON.stringify(dataIn));
		var invoice_total = parseFloat(nlapiLookupField('invoice', dataIn.invoice_id, 'total'));
		var payment_amt = parseFloat(dataIn.payment);
		if( invoice_total >= payment_amt ) {
			var payment_rec = nlapiTransformRecord('invoice', dataIn.invoice_id, 'customerpayment');
			
			try {
				for(var prop in dataIn){
					nlapiLogExecution('DEBUG', 'props in loop', prop+' : '+dataIn[prop]);
					if(prop == 'action' || prop == 'referer' || prop == 'invoice_id' || prop == 'email') continue;
					if(prop == 'payment') {
						var value = parseFloat(dataIn[prop]);
						//nlapiLogExecution('DEBUG', 'Values in loop', value);
						payment_rec.setFieldValue(prop, value);
						payment_rec.setFieldValue('autoapply', 'T');
						continue;
					}
					payment_rec.setFieldValue(prop, dataIn[prop]);
				}
				
				
				
				var rec_id = nlapiSubmitRecord(payment_rec, false, false);
				
				var balance =  rec_id ? nlapiLookupField('invoice', dataIn.invoice_id, 'amountremaining'):null; 
				var payment_number = rec_id ? nlapiLookupField('customerpayment', rec_id, 'tranid'):null;
				
				nlapiLogExecution('DEBUG', 'Payment Number', payment_number);
				
				if (rec_id){
					var payment_print = nlapiPrintRecord('TRANSACTION', rec_id, 'PDF');
					
					// Send email to customer
					var attachment = [];
					attachment.push(payment_print);
					var record = new Object();
					record['TRANSACTION'] = rec_id;
					
					var author = nlapiLookupField('invoice', dataIn.invoice_id, 'salesrep');
					var recipient = dataIn.email;
					var body = 'Thank you for your payment. <br/>';
						body += 'Your receipt is attached. <br/><br/>';
						body += 'Please feel free to reach us for any concerns.';
					nlapiSendEmail(author, recipient, 'Your receipt from Tax Analysts', body, null, null, record, attachment);
				}
				
				
				var response = {};
				response.status = 'success';
				response.rec_id = rec_id;
				response.reference_num = payment_number;
				response.balance = balance;

				return response;
				
			}
			catch(e) {
				nlapiLogExecution('DEBUG', 'Execution Error', e);
				err.status = 'fail';
				err.code = 'E2';
				err.details = e;
				return err;
			}
		}
		
		// if payment is more than invoice total stop processing
		else {
			err.status = 'fail';
			err.code = 'Payment amount exceed the invoice total amount';
			err.detail = 'Payment amount is more than the invoice amount.';	
		}
	}
}

/*
 * {
 * 	status: 'success',
 * 	invoice: [{
 * 		invoice_id: 1234,
 * 		amount: 1234,
 * 		tran_id: 1234,
 * 		cust_id: 1234,
 * 	}]
 * }
 */
/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
