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
	if ((type == 'create'|| type == 'edit') && exeContext != 'userinterface'){
		//Set OLR to include transaction discount
		var txnid = nlapiGetFieldValue('custrecord_ci_original_transaction');
		var contractId = nlapiGetFieldValue('custrecord_ci_contract_id');
		if (txnid){
			var txntype = nlapiLookupField('transaction',txnid,'recordtype');
			if (isNotEmpty(txnid)){
				var rec = nlapiLoadRecord(txntype,txnid);
				var sosubtot = MyParseFloat(rec.getFieldValue('subtotal'));
				var sodisc = MyParseFloat(rec.getFieldValue('discounttotal'));
				var discmult = 1+(sodisc/sosubtot);
				var soline = nlapiGetFieldValue('custrecord_ci_original_so_lineno');
				nlapiLogExecution('debug','soline '+soline);
				if (isNotEmpty(soline)){
					var olr = MyParseFloat(rec.getLineItemValue('item','custcol_list_rate',soline));
					nlapiLogExecution('debug','olr '+olr+' discmult '+discmult);
					var newolr = olr*discmult;
					nlapiSetFieldValue('custrecord_ci_original_list_rate_base',newolr);
					nlapiSetFieldValue('custrecord_ci_original_list_rate',newolr);
					
				}	
			}
		}
		
		if 
	}
}

function TNL_ActivateWebUsersSCHED(){
	nlapiLogExecution('debug','TNL_ActivateWebUsersSCHED - START');
	
	var context = nlapiGetContext();
	var paramsJSON = context.getSetting('SCRIPT','custscript_contractiteminfo');
	paramsJSON = JSON.parse(paramsJSON);
	var ciContract = paramsJSON[0].ciContract;
	var customer = paramsJSON[0].customer;
	var itemId = paramsJSON[0].itemId;
		
	itemId = itemId.split(',');
	var cuFils = [];
	var cuCols = [];
	cuFils.push(new nlobjSearchFilter('custrecord_webuser_tnl_flag',null,'is','F'));
	cuFils.push(new nlobjSearchFilter('custrecord_contractuser_items',null,'noneof',itemId));
	cuFils.push(new nlobjSearchFilter('custrecord_contractuser_customer',null,'is',customer));
	cuCols.push(new nlobjSearchColumn('custrecord_contractuser_contract'));
	cuCols.push(new nlobjSearchColumn('custrecord_contractuser_email').setSort());
	var cuResults = nlapiSearchRecord('customrecord_contractuser',null,cuFils,cuCols);
	if (isNotEmpty(cuResults)){
		nlapiLogExecution('debug','cuResults.length '+cuResults.length);
		for (var i = 0; i<cuResults.length;i++){
			var curec = '';
			var cuContract = cuResults[i].getValue('custrecord_contractuser_contract');
			var cuid = cuResults[i].getId();
			nlapiSubmitField('customrecord_contractuser',cuid,'custrecord_webuser_tnl_flag','T');
			if (i>0){
				var email = cuResults[i].getValue('custrecord_contractuser_email');
				var prevEmail = cuResults[i-1].getValue('custrecord_contractuser_email');
				if (email == prevEmail)
					continue;
			}
			if (cuContract == ciContract){
				nlapiLogExecution('debug','cuid '+cuid+' ciContract '+ciContract);
				curec = nlapiLoadRecord('customrecord_contractuser',cuid);
				var itemsArr = curec.getFieldValues('custrecord_contractuser_items');
				if (isNotEmpty(itemsArr))
					itemsArr = itemsArr.concat(itemId);
				curec.setFieldValues('custrecord_contractuser_items',itemsArr);
			}
			else{
				//nlapiLogExecution('debug','cuid '+cuid+' ciContract '+ciContract);
				curec = nlapiCopyRecord('customrecord_contractuser',cuid);
				curec.setFieldValues('custrecord_contractuser_items',itemId);
				curec.setFieldValue('custrecord_contractuser_contract',ciContract);
			}
			nlapiSubmitRecord(curec);
			// Check usageRemaining
			var usageRemaining = parseFloat(context.getRemainingUsage());
			nlapiLogExecution('debug',' usageRemaining '+usageRemaining);
			if (usageRemaining <= 100 && cuResults.length > 0) {
				var params = [];
				params['custscript_contractiteminfo'] = JSON.stringify(paramsJSON);
				var status = nlapiScheduleScript(context.getScriptId(), null,params);
				if (status == 'QUEUED')
					break;
			}
		}
	}
}

function contractItemAfterSubmit(type){
	nlapiLogExecution('debug','contractItemAfterSubmit'+type);
	if (type == 'create' || type == 'edit'){
		if (type == 'create'){
			//Update all web users with TNL activation item
			var __ITEMS_UPDATE_WEBUSERS = [2068,2069];
			var itemId = nlapiGetFieldValue('custrecord_ci_item');
			nlapiLogExecution('debug','itemId '+itemId);
			if (__ITEMS_UPDATE_WEBUSERS.indexOf(itemId*1)>-1){
				var paramsJSON = [];
				var ciContract = nlapiGetFieldValue('custrecord_ci_contract_id');
				var customer = nlapiGetFieldValue('custrecord_ci_bill_to_customer');
				
				//Call Scheduled Script to update Contract Users
				paramsJSON.push({
					"itemId" : itemId,
					"ciContract" : ciContract,
					"customer" : customer
				});
				
				var params = [];
				params['custscript_contractiteminfo'] = JSON.stringify(paramsJSON);
				nlapiScheduleScript('customscript_tnl_update_webuser_sched',null,params);
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
			var flds = ['custentity_activecontractvalue','custentity_activecontracts'];
			var vals = [amt,annualamt];
			nlapiSubmitField('customer',custid,flds,vals);
		}
		
		// Write TA Contract Value 
		var ta_val_filters = [ new nlobjSearchFilter('internalid', 'custrecord_ci_bill_to_customer', 'is', custid), 
		                       new nlobjSearchFilter('custrecord_ci_contract_id', null, 'is', contract_id)];
		var ta_val_result = nlapiSearchRecord(null, 'customsearch__ta_contract_value', ta_val_filters);
		var item_values = [];
		if(ta_val_result) {
			for(var i = 0; i < ta_val_result.length; i += 1) {
				item_values.push(parseFloat(ta_val_result[i].getValue('formulacurrency', null, 'sum')));
			}
			var total_value = _.reduce(item_values, function(sum, items) {
				return sum += items;
			}, 0);
			nlapiLogExecution('debug', 'TA Contract Value', total_value);
			nlapiSubmitField('customrecord_contracts', contract_id, 'custrecord_ta_contract_value', total_value);
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