/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Jan 2015     Dana
 *
 */
function contractItemBeforeSubmit(type){
	var context = nlapiGetContext();
	exeContext = context.getExecutionContext();
	nlapiLogExecution('debug','contractItemBeforeSubmit'+type);
	if (type == 'create'|| type == 'edit' && exeContext != 'userinterface'){
		//Set OLR to include transaction discount
		var txnid = nlapiGetFieldValue('custrecord_ci_original_transaction');
		if (txnid){
			var txntype = nlapiLookupField('transaction',txnid,'recordtype');
			if (isNotEmpty(txnid)){
				var rec = nlapiLoadRecord(txntype,txnid);
				var soline = nlapiGetFieldValue('custrecord_ci_original_so_lineno');
				var sosubtot = MyParseFloat(rec.getFieldValue('subtotal'));
				var sodisc = MyParseFloat(rec.getFieldValue('discounttotal'));
				var inline_disc_val = soline ? MyParseFloat(rec.getLineItemValue('item', 'custcol_inline_discount', soline)) : 0;
				var discmult = 1+(sodisc/sosubtot);
				var inline_disc = 1-(inline_disc_val/100);
				nlapiLogExecution('debug','soline '+soline);
				if (isNotEmpty(soline)){
					var olr = MyParseFloat(rec.getLineItemValue('item','custcol_list_rate',soline));
					nlapiLogExecution('debug','olr '+olr+' discmult '+discmult);
					var newolr = olr*discmult*inline_disc;
					nlapiSetFieldValue('custrecord_ci_original_list_rate_base',newolr);
					nlapiSetFieldValue('custrecord_ci_original_list_rate',newolr);
				}	
			}
		}	
	}
}

function contractItemAfterSubmit(type){
	nlapiLogExecution('debug','contractItemAfterSubmit'+type);
	if (type == 'create' || type == 'edit'){
		if (type == 'create' ){
			//Update all web users with TNL activation item
			var __ITEMS_UPDATE_WEBUSERS = [2068,2069];
			var itemId = nlapiGetFieldValue('custrecord_ci_item');
			nlapiLogExecution('debug','itemId '+itemId);
			//Call scheduled script to create TNL web users
			if (__ITEMS_UPDATE_WEBUSERS.indexOf(itemId*1)>-1){
				var ciContract = nlapiGetFieldValue('custrecord_ci_contract_id');
				var customer = nlapiGetFieldValue('custrecord_ci_bill_to_customer');
				var params = [];
				params['custscript_wu_contractid'] = ciContract;
				params['custscript_wu_itemid'] = itemId;
				params['custscript_wu_customer'] = customer;
				nlapiScheduleScript('customscript_createtnl_webuser_sched',null,params);
			}
		}
		//Set hand Delivery to T if created from contract item Hand Delivery = T
		var cihandDel = nlapiGetFieldValue('custrecord_ci_handdelivery');
		var ciOrdType = nlapiGetFieldValue('custrecord_ci_order_type');
		if (cihandDel != 'T' && ciOrdType == '2'){
			var ciid = nlapiGetRecordId();
			var txnId = nlapiGetFieldValue('custrecord_ci_original_transaction');
			if (isNotEmpty(txnId)){
				var recType = nlapiLookupField('transaction',txnId,'type');
				if (recType == 'SalesOrd'){
					var soline = nlapiGetFieldValue('custrecord_ci_original_so_lineno');
					var sorec = nlapiLoadRecord('salesorder',txnId);
					var solsn = sorec.findLineItemValue('item','line',soline);
					if (solsn != -1){
						var fromciid = sorec.getLineItemValue('item','custcol_from_ci_id',solsn);
						if (isNotEmpty(fromciid)){
							fromciid = fromciid.split(',');
							for (var ci in fromciid){
								var handDel = nlapiLookupField('customrecord_contract_item',fromciid[ci],'custrecord_ci_handdelivery');
								if (handDel == 'T'){
									nlapiSubmitField('customrecord_contract_item',ciid,'custrecord_ci_handdelivery','T');
									break;
								}	
							}
						}	
					}
				}
			}	
		}	
	}
	
	if (type == 'create' || type == 'edit'){
		//Update Customer Active Contracts Amount.			
		custid = nlapiGetFieldValue('custrecord_ci_bill_to_customer');
		var contract_id = nlapiGetFieldValue('custrecord_ci_contract_id');
		var cifils = [new nlobjSearchFilter('internalid', 'custrecord_contracts_bill_to_customer', 'is', custid)];
		var ciresults = nlapiSearchRecord(null,'customsearch__customer_annual_contractva',cifils);
		if (isNotEmpty(ciresults)){
			var annualamt = ciresults[0].getValue('custrecord_swe_annual_contract_val_gross',null,'sum');
			var amt = ciresults[0].getValue('custrecord_swe_contract_value_base',null,'sum');
			var flds = ['custentity_activecontractvalue'];
			var vals = [amt];
			nlapiSubmitField('customer',custid,flds,vals);
		}
		
		// Writes Annualized Contract Value
		var ta_annual_cont_val_filter = [ new nlobjSearchFilter('custrecord_ci_bill_to_customer', null, 'is', custid) ];
		var ta_annual_cont_val_results = nlapiSearchRecord(null, 'customsearch__ta_annual_cont_value', ta_annual_cont_val_filter);
		
		if(ta_annual_cont_val_results) {
			var annual_cont_val_sum = _.reduce(ta_annual_cont_val_results, function(sum, item) {
				return sum += +item.getValue('custrecord_ci_original_list_rate_base') * +item.getValue('custrecord_ci_quantity') * 12;
			}, 0);
		nlapiLogExecution('DEBUG', 'Annual Contract Value Sum', annual_cont_val_sum);
		nlapiSubmitField('customer', custid, 'custentity_activecontracts', annual_cont_val_sum);
		}
		
		// Write TA Contract Value and custrecord_ta_full_renewal_value  
		var ta_val_filters = [ new nlobjSearchFilter('internalid', 'custrecord_ci_bill_to_customer', 'is', custid), 
		                       new nlobjSearchFilter('custrecord_ci_contract_id', null, 'is', contract_id)];
		var ta_val_result = nlapiSearchRecord(null, 'customsearch__ta_contract_value', ta_val_filters);
		var ta_full_val_result = nlapiSearchRecord(null, 'customsearch__ta_contract_full_value', ta_val_filters);
		var item_values = [];
		var item_full_values = [];
		
		// Setting TA Sales Renewal Value
		if(ta_val_result) {
			
			var total_value = getTotalValue(ta_val_result, []);
			
			if (total_value > 0){
				 nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_contract_value', total_value);
				 updateOpportunity(contract_id, total_value);
			} else {
				nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_contract_value', 0);
				updateOpportunity(contract_id, 0);
			} 
		}
		else {
			// run another search for Contract Item without original transaction record attached
			var no_origin_sv_contract_itemSearch = nlapiSearchRecord("customrecord_contract_item",null,
					[
					   ["formulanumeric: NVL({custrecord_ci_original_transaction.internalid}, 0) ","equalto","0"], 
					   "AND", 
					   ["custrecord_ci_contract_id","anyof",contract_id]
					], 
					[
					   new nlobjSearchColumn("custrecord_ci_contract_id",null,"GROUP"), 
					   new nlobjSearchColumn("custrecord_ci_item",null,"GROUP"), 
					   new nlobjSearchColumn("custrecord_ci_quantity",null,"SUM"), 
					   new nlobjSearchColumn("formulacurrency",null,"SUM").setFormula("CASE WHEN NVL({custrecord_ci_original_transaction.internalid}, 0) > 0 THEN CASE WHEN {custrecord_ci_original_transaction.custbody_order_type} = 'Contract - Renewal' THEN {custrecord_ci_original_list_rate_base} * 12 * {custrecord_ci_quantity} ELSE CASE WHEN {custrecord_ci_original_transaction.custbody_order_type} = 'Contract - New' OR {custrecord_ci_original_transaction.custbody_order_type} = 'Contract - Upsell' THEN CASE WHEN {custrecord_ci_term} > 12 THEN {custrecord_ci_original_list_rate_base} * 12 * {custrecord_ci_quantity} ELSE {custrecord_ci_original_list_rate_base} * {custrecord_ci_term} * {custrecord_ci_quantity} END END END ELSE {custrecord_ci_original_list_rate_base} * 12 * {custrecord_ci_quantity} END"), 
					   new nlobjSearchColumn("custrecord_ci_original_discount",null,"MAX")
					]
			);
			
			if(no_origin_sv_contract_itemSearch) {
				var total_sv_value = getTotalValue(no_origin_sv_contract_itemSearch, []); 
				
				if(total_sv_value > 0) {
					nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_contract_value', total_sv_value);
				} else {
					nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_contract_value', 0);
				}
			} else {
				nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_contract_value', 0);
			}
		}
			
		
		// Setting TA Full Renewal Value
		if(ta_full_val_result) {
			
			var total_full_value = getTotalValue(ta_full_val_result, item_full_values);

			if (total_full_value > 0) {
				nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_full_renewal_value', total_full_value);
			}
			else {
				nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_full_renewal_value', 0);
			} 
			
		}
		else {
			// run another search for Contract Item without original transaction record attached
			var no_origin_contract_itemSearch = nlapiSearchRecord("customrecord_contract_item",null,
					[
					   ["formulanumeric: NVL({custrecord_ci_original_transaction.internalid}, 0)","equalto","0"], "AND",
					   ["custrecord_ci_contract_id","anyof",contract_id]
					], 
					[
					   new nlobjSearchColumn("custrecord_ci_contract_id",null,"GROUP"), 
					   new nlobjSearchColumn("custrecord_ci_item",null,"GROUP"), 
					   new nlobjSearchColumn("custrecord_ci_quantity",null,"SUM"), 
					   new nlobjSearchColumn("formulacurrency",null,"SUM").setFormula("{custrecord_ci_original_list_rate_base} * 12 * {custrecord_ci_quantity} "), 
					   new nlobjSearchColumn("custrecord_ci_original_discount",null,"MAX")
					]
				);
			if(no_origin_contract_itemSearch) {
				var total_full_value_no_orig = getTotalValue(no_origin_contract_itemSearch, []);
				if (total_full_value_no_orig > 0) {
					nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_full_renewal_value', total_full_value_no_orig);
				}
				else {
					nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_full_renewal_value', 0);
				}
			} else {
				nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_full_renewal_value', 0);
			}	
		}
		

	}
}


function ccerp_update_activeContractValue_SCHED(){
	nlapiLogExecution('debug','update_activeContractValue_SCHED');
	
	var ciresults = nlapiSearchRecord(null,'customsearch__customer_annual_contractva');
	if (isNotEmpty(ciresults)){
		for (var i = 0; i < ciresults.length;i++){
			var custid = ciresults[i].getValue('internalid','custrecord_contracts_bill_to_customer','group');
			var annualamt = ciresults[i].getValue('custrecord_swe_annual_contract_val_gross',null,'sum');
			var amt = roundCurrency(ciresults[i].getValue('custrecord_swe_contract_value_base',null,'sum'));
			var custamt = MyParseFloat(roundCurrency(nlapiLookupField('customer',custid,'custentity_activecontractvalue')));
			if (amt != custamt)
				var flds = ['custentity_activecontractvalue','custentity_activecontracts'];
				var vals = [amt,annualamt];
				nlapiSubmitField('customer',custid,flds,vals);
		}
	}
}
// get total of the results set

function getTotalValue(ta_full_val_result, item_full_values) {
	for(var i = 0; i < ta_full_val_result.length; i += 1) {
		if(+ta_full_val_result[i].getValue('custrecord_ci_quantity', null, 'sum') > 0) {
			// Taking inline discount into calculation
			var discount = parseFloat(ta_full_val_result[i].getValue('custrecord_ci_original_discount', null, 'max'));
			
			if(ta_full_val_result[i].getValue('custrecord_ci_original_discount', null, 'max')) {
				item_full_values.push(+ta_full_val_result[i].getValue('formulacurrency', null, 'sum') * (1-(discount / 100)));
			}
			else {
				item_full_values.push(+ta_full_val_result[i].getValue('formulacurrency', null, 'sum'));
			}
		}
		else {
			item_full_values.push(0);
		}
		
	}
	// Getting Total Value and submitting the total 
	nlapiLogExecution('DEBUG', 'item_full_values', JSON.stringify(item_full_values));
	return _.reduce(item_full_values, function(sum, item) {
		return sum += item;
	}, 0);
};

// Update Opportunity for given contract_id
function updateOpportunity(contract_id, total_full_value){
	var renew_opp_id = nlapiLookupField('customrecord_contracts', contract_id, 'custrecord_contract_renewal_opp');
	if(renew_opp_id) {
		var renewed_from_contract_val = nlapiLookupField('opportunity', renew_opp_id, 'custbody_renewedfromcontractvalue');
		if(+renewed_from_contract_val != +total_full_value) {
			nlapiSubmitField('opportunity', renew_opp_id, 'custbody_renewedfromcontractvalue', total_full_value);
		}
	}
};



