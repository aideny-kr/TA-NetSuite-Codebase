/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       26 Nov 2014     Dana
 *
 */


function ta_Bad_Debt_Trigger(){
	var invId = nlapiGetRecordId();
	var startdate = nlapiLookupField('invoice', invId, 'startdate');
	var enddate = nlapiLookupField('invoice', invId, 'enddate');
	var url = nlapiResolveURL('SUITELET', 'customscript_bad_debt_auto', 'customdeploy1');
	url += '&invId=' + invId + '&startdate=' + startdate + '&enddate=' + enddate;
	window.open(url, '_self');
}

function ccerp_InvoiceBeforeLoad(type, form, request){
	nlapiLogExecution('debug', 'InvoiceBeforeLoad '+type);
	var role = nlapiGetRole();
	var inv_status = nlapiGetFieldValue('status')
	form.setScript('customscript_invoice_client');
	if(type=='view' && (role == '1034' || role == '3') && inv_status == 'Open'){
		form.addButton('custpage_bad_debt_btn', 'Create Bad Debt', 'ta_Bad_Debt_Trigger()');
	}
}

function ccerp_InvoiceBeforeSubmit(type){
	nlapiLogExecution('debug', 'InvoiceBeforeSubmit '+type);
}


function ccerp_InvoiceAfterSubmit(type){
	nlapiLogExecution('debug', 'InvoiceAfterSubmit '+type);
	//Set Lifetime Value of customer (custom Field)
	if (type == 'create' || type == 'edit' || type == 'delete'){
		var newcustvalue = 0;
		var txnid = nlapiGetRecordId();
		var context = nlapiGetContext();
		var custid = nlapiGetFieldValue('entity');
		var currentcustvalue = MyParseFloat(nlapiLookupField('customer', custid, 'custentity_lifetimesales'));
		var txntot = MyParseFloat(nlapiGetFieldValue('total'));
		if (type == 'edit'){
			oldrec = nlapiGetOldRecord();
			var oldtot = MyParseFloat(oldrec.getFieldValue('total'));
			if (oldtot != txntot)
				txntot = txntot-oldtot;
			else
				txntot = 0;
		}
		newcustvalue = currentcustvalue+txntot;
		if (type == 'delete')
			newcustvalue = currentcustvalue-txntot;
		nlapiSubmitField('customer',custid,'custentity_lifetimesales',newcustvalue);
		if (type == 'create'){
			var txnrec = nlapiLoadRecord('invoice',txnid);
			for (var i = 1; i <= txnrec.getLineItemCount('item'); i++) {
				var revrec = txnrec.getLineItemValue('item','revrecschedule',i);
				if (isNotEmpty(revrec)){
					var startdate = txnrec.getLineItemValue('item','custcol_swe_contract_start_date',i);
					var enddate = txnrec.getLineItemValue('item','custcol_swe_contract_end_date',i);
					txnrec.setLineItemValue('item','revrecstartdate',i,startdate);
					txnrec.setLineItemValue('item','revrecenddate',i,enddate);
				}
			}
			nlapiSubmitRecord(txnrec,true);
			
			nlapiLogExecution('DEBUG', 'Invoice Auto Apply Begins', context.getExecutionContext());
			if(context.getExecutionContext() == 'userinterface' || context.getExecutionContext() == 'userevent'){
			
				
				// if there is any credit memo or customer deposit then apply them to this invoice. 
				var balance = +nlapiLookupField('customer', custid, 'balance');
				var deposit = +nlapiLookupField('customer', custid, 'depositbalance');
				if(balance < 0 || deposit > 0){
					var payment_rec = nlapiTransformRecord('invoice', txnid, 'customerpayment');
					
					var apply_count = payment_rec.getLineItemCount('apply');
					var credit_count = payment_rec.getLineItemCount('credit');
					var deposit_count = payment_rec.getLineItemCount('deposit');
					
					nlapiLogExecution('DEBUG', 'Counter Check', 'Apply: ' + apply_count + 'Credit: ' + credit_count, 'Deposit: ' + deposit_count);
					
					var credit_deposit_total = 0;
					
					try{

						if(credit_count > 0){
							for(var x = 0; x < credit_count; x++){
								credit_deposit_total += MyParseFloat(payment_rec.getLineItemValue('credit', 'due', x+1));
								payment_rec.setLineItemValue('credit', 'apply', x+1, 'T');
							}
						}
						
						if(deposit_count > 0){
							for(var y = 0; y < deposit_count; y++){
								credit_deposit_total += MyParseFloat(payment_rec.getLineItemValue('deposit', 'remaining', y+1));
								payment_rec.setLineItemValue('deposit', 'apply', y+1, 'T');
							}
						}
						
						nlapiLogExecution('DEBUG', 'Credit + Deposit Total', credit_deposit_total);
						
						// if credit_deposit_total > txntot then apply to invoice without specifying the amount
						
						if(apply_count > 0){
							for(var i = 0; i < apply_count; i++){
								var apply_internal_id = payment_rec.getLineItemValue('apply', 'internalid', i+1);
								if(txnid == apply_internal_id){
									payment_rec.setLineItemValue('apply', 'apply', i+1, 'T');
									if(credit_deposit_total <= txntot)	payment_rec.setLineItemValue('apply', 'amount', i+1, credit_deposit_total);
								}
							}
						}
						
						if(credit_deposit_total <= txntot) payment_rec.setFieldValue('payment', 0);
						
						nlapiSubmitRecord(payment_rec, true, true);
						
					}catch(e){
						throw "There was an error during the process. Please consult your system administrator. \n Error Code: " + e;
					}
				}
			}
		}
	}
 }
