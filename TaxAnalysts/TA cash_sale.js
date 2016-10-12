/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       31 Dec 2015     Chan
 *
 */


function cashSale_AfterSubmit() {
	//Set Lifetime Value of customer (custom Field)
	if (type == 'create' || type == 'edit' || type == 'delete'){
		var newcustvalue = 0;
		var role_id = nlapiGetRole();
		var txnid = nlapiGetRecordId();
		var custid = nlapiGetFieldValue('entity');
		var currentcustvalue = parseFloat(nlapiLookupField('customer', custid, 'custentity_lifetimesales'));
		var txntot = parseFloat(nlapiGetFieldValue('total'));
		if (type == 'edit' && role_id != '3'){
			oldrec = nlapiGetOldRecord();
			var oldtot = parseFloat(oldrec.getFieldValue('total'));
			if (oldtot != txntot)
				txntot = txntot-oldtot;
			else
				txntot = 0;
		}
		newcustvalue = currentcustvalue+txntot;
		if (type == 'delete')
			newcustvalue = currentcustvalue-txntot;
		nlapiLogExecution('DEBUG', 'Lifetime Value to be added', txntot);
		nlapiSubmitField('customer',custid,'custentity_lifetimesales',newcustvalue);
	}
}