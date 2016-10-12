/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 Mar 2015     Dana
 *
 */


function ccerpCreditMemo_BeforeLoad(type, form, request){
	nlapiLogExecution('debug','ccerpCreditMemo_BeforeLoad '+type);
}


function ccerpCreditMemo_BeforeSubmit(type){
	
	nlapiLogExecution('debug','ccerpCreditMemo_BeforeSubmit '+type);
	
	//Update New and renewal business Reduce new business first
	if (type == 'create' || type == 'edit' || type == 'copy'){
		if (type == 'create'){
			for (var i = 1; i <= nlapiGetLineItemCount('item'); i++) {
				var revrec = nlapiGetLineItemValue('item','revrecschedule',i);
				if (isNotEmpty(revrec)){
					var startdate = nlapiGetLineItemValue('item','custcol_swe_contract_start_date',i);
					var enddate = nlapiGetLineItemValue('item','custcol_swe_contract_end_date',i);
					nlapiSetLineItemValue('item','revrecstartdate',i,startdate);
					nlapiSetLineItemValue('item','revrecenddate',i,enddate);
				}
			}
		}
		cmNewBusinessTot = 0;
		cmRenBusinessTot = 0;
		var cmTot = MyParseFloat(nlapiGetFieldValue('total'));
		var cmcreatedfrom = nlapiGetFieldValue('createdfrom');
		if (isNotEmpty(cmcreatedfrom)){
			var rectype = nlapiLookupField('transaction',cmcreatedfrom,'type');
			if(rectype=='RtnAuth' || rectype == 'CustInvc'){
				var txnid = nlapiLookupField('transaction',cmcreatedfrom,'createdfrom');
				if (isNotEmpty(txnid) && nlapiGetContext().getUser() != '54452'){
					txnflds=['total','custbody_ta_trans_new_business'];
					var txnvals = nlapiLookupField('transaction',txnid,txnflds);
					var newbusinessTot = MyParseFloat(txnvals['custbody_ta_trans_new_business']);
					//Search for New business reduction on other Credit memos from this invoice
					cmFils = [];
					cmFils.push(new nlobjSearchFilter('createdfrom',null,'is',txnid));
					cmresults = nlapiSearchRecord('transaction','customsearch__credit_memo_for_ra',cmFils);
					if (isNotEmpty(cmresults)){
						newbusinessTot += MyParseFloat(cmresults[0].getValue('custbody_ta_trans_new_business','applyingtransaction','SUM'));
					}	
					nlapiLogExecution('debug','newbusinessTot '+newbusinessTot+'txnid '+txnid);
					//var renbusinessTot = MyParseFloat(txnvals['custbody_ta_total_renewal_amount']);
					if(newbusinessTot >= cmTot)
						cmNewBusinessTot = cmTot*-1;
					else{
						cmNewBusinessTot = newbusinessTot*-1;
						cmRenBusinessTot = (newbusinessTot-cmTot);
					}
					nlapiSetFieldValue('custbody_ta_trans_new_business',cmNewBusinessTot);
					nlapiSetFieldValue('custbody_ta_total_renewal_amount',cmRenBusinessTot);
				}
			}
		}
	}
	
}

function ccerpCreditMemo_AfterSubmit(type){
	nlapiLogExecution('debug','ccerpCreditMemo_AfterSubmit '+type);

	//Set Lifetime Value of customer (custom Field)
	if (type == 'create' || type == 'edit' || type == 'delete'){
		var newcustvalue = 0;
		var txnid = nlapiGetRecordId();
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
		newcustvalue = currentcustvalue-txntot;
		if (type == 'delete')
			newcustvalue = currentcustvalue+txntot;
		nlapiSubmitField('customer',custid,'custentity_lifetimesales',newcustvalue);
		if (type == 'create' || type == 'edit'){
			var txnrec = nlapiLoadRecord('creditmemo',txnid);
			for (var i = 1; i <= txnrec.getLineItemCount('item'); i++) {
				var revrec = txnrec.getLineItemValue('item','revrecschedule',i);
				if (revrec){
					var startdate = txnrec.getLineItemValue('item','custcol_swe_contract_start_date',i);
					var enddate = txnrec.getLineItemValue('item','custcol_swe_contract_end_date',i);
					nlapiSetLineItemValue('item','revrecstartdate',i,startdate);
					nlapiSetLineItemValue('item','revrecenddate',i,enddate);
				}
			}
			nlapiSubmitRecord(txnrec,true);
		}
	}
 
}
