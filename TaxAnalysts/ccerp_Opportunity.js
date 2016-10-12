/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Sep 2014     Dana
 *
 */

function ta_opportunity_save_record() {
	var upsell_contract = nlapiGetFieldValue('custbody_contract_name');
	var order_type = nlapiGetFieldValue('custbody_order_type');
	if(upsell_contract !== '') {
		var opp_startdate = nlapiGetFieldValue('custbody_startdate');
		var contract_startdate = nlapiLookupField('customrecord_contracts', upsell_contract, 'custrecord_contracts_start_date');
			
		var opp_startdate_time = nlapiStringToDate(opp_startdate, 'datetime');
		var contract_startedate_time = nlapiStringToDate(contract_startdate, 'datetime');
		
		var item_list_length = nlapiGetLineItemCount('item');
		var item_start_date_validate = true;
		for(var i = 1; i <= item_list_length; i += 1) {
			var line_item_datetime = nlapiStringToDate(nlapiGetLineItemValue('item', 'custcol_swe_contract_start_date', i), 'datetime');
			if(line_item_datetime < contract_startedate_time) item_start_date_validate = false;
		}
		//nlapiLogExecution('DEBUG', 'Save Record, item_start_date_validate', item_start_date_validate);

		if(opp_startdate_time < contract_startedate_time) {
			alert("Contract Start Date cannot be earlier than the Upselling Contract's Start Date");
			return false;
		}
		else if(!item_start_date_validate) {
			alert("Item Contract Start Date cannot be earlier than Start Date of the Upselling Contract");
			return false;
		} 
		else {
			nlapiSetFieldValue('custbody_order_type', 3, true, true);
			return true;
		}
			
	}
	else {
		return true;
	}
		
}


function Opportunity_BeforeLoad(type, form, request){
	nlapiLogExecution('debug', 'Opportunity_BeforeLoad ' + type);
	
	if (type == 'view' || type == 'create' || type == 'edit'){
		BodyFieldDisable('entitystatus');
		BodyFieldHide('probability');
		var ordtype = nlapiGetFieldValue('custbody_order_type');
		if (ordtype == 2){
		BodyFieldInline('custbody_contract_name');
		}
	}

	var quoteid = nlapiGetFieldValue('custbody_ta_updated_from_quote');
		
	if (isEmpty(quoteid)) {
		nlapiLogExecution('debug', 'No Quote');
		nlapiSetFieldValue('custbody_ta_total_renewal_amount','');
		nlapiSetFieldValue('custbody_ta_trans_new_business','');
		nlapiSetFieldValue('custbody_cotermcontracttotal','');
	}
	
	if(type=='view' || type == 'edit'){
		form.setScript('customscript_ccerpopportunity_client');
		nlapiLogExecution('debug', 'type is view '+form.getSubList('estimates'));
		var sl = form.getSubList('estimates');
		if(sl.getButton('createestimate'))
			sl.removeButton('createestimate');
		
		form.addButton('custpage_newquote_btn','New Quote', 'ccerpNewQuote()');
	}
}

function ccerpNewQuote(){
	
	//process_estopp('estimate');
	
	//var url = nlapiResolveURL('RECORD','')
//	var opid = nlapiGetRecordId();
//	var ordertype = nlapiLookupField('opportunity', opid, 'custbody_order_type');
//	if (ordertype == 2)
	var custform = '166';
//	else custform = '126';
	
	var type = 'estimate';
	if (document.forms['main_form'].elements['linked'].value == 'F' || confirm('This Opportunity has already been processed.  Are you sure you want to process again?'))
		document.location='/app/accounting/transactions/'+type+'.nl?memdoc=0&transform=opprtnty&e=T&id='+nlapiGetRecordId()+'&cf='+custform+'&whence=';
}

function Opportunity_BeforeSubmit(type){
	
	
	nlapiLogExecution('debug', 'Opportunity_BeforeSubmit ' + type);
	if (type == 'create'){
		var ordertype = nlapiGetFieldValue('custbody_order_type');
		if (ordertype == 2){
			var fromcontract = nlapiGetFieldValue('custbody_swe_from_contract');
			if (isNotEmpty(fromcontract)){
				var fromContractVals = nlapiLookupField('customrecord_contracts', fromcontract, ['custrecord_contracts_end_date', 'custrecord_contract_renewal_terms']);
		        var enddate = fromContractVals['custrecord_contracts_end_date'];
		        var renewalterms = fromContractVals['custrecord_contract_renewal_terms'];
		        var opStartDate = nlapiDateToString(nlapiAddDays(nlapiStringToDate(enddate), 1));
		        nlapiSetFieldValue('custbody_startdate',opStartDate);
		        nlapiSetFieldValue('custbody_enddate',nlapiDateToString(SWE.Library.dates.addMonths2(renewalterms,opStartDate)));
		        nlapiSetFieldValue('custbody_tran_term_in_months',renewalterms);
		        nlapiSetFieldValue('expectedclosedate',nlapiDateToString(nlapiAddDays(nlapiStringToDate(enddate), 1)));
		        nlapiSetFieldValue('entitystatus', '132');
		        nlapiSetFieldValue('title','Contract Renewal - '+opStartDate);
		        
			}
		}
	}
}


function Opportunity_AfterSubmit(type){
	nlapiLogExecution('debug', 'Opportunity_AfterSubmit ' + type);
	var opid = nlapiGetRecordId();
	if (type=='edit'){
		var taval = nlapiGetFieldValue('custbody_ta_opportunity_status');
		var ordertype = nlapiGetFieldValue('custbody_order_type');
		nlapiLogExecution('debug','taval '+taval+'ordertype '+ordertype);
		var entitystatus = '';
		if (taval == 1) {
			if (ordertype == 2) {
				entitystatus = 132;	
			}
			else entitystatus = 128;
		}
		else if (taval==2) {
			if (ordertype == 2) {
				entitystatus = 135;
			}
			else entitystatus = 13;
		}
		else if (taval==3) {
			if (ordertype == 2) {
				entitystatus = 133;
			}
			else entitystatus = 8;
		}
		else if (taval==4) {
			if (ordertype == 2) {
				entitystatus = 134;
			}
			else entitystatus = 119;
		}
		else if (taval==5) {
			entitystatus = 130;
		}
		else if (taval==10) {
			if (ordertype == 2) {
				entitystatus = 136;
			}
			else entitystatus = 127;
		}
		else if (taval==11) {
			if (ordertype == 2) {
				entitystatus = 135;
			}
			else entitystatus = 13;
		}
		var opFlds = ['entitystatus', 'probability'];
		var prob = nlapiLookupField('customerstatus',entitystatus,'probability');
		var opVals = [];
		opVals.push(entitystatus);
		opVals.push(prob);
		nlapiSubmitField('opportunity',opid,opFlds,opVals);
	}
}

function ta_opportunity_field_changed(type, name, linenum){
	if (name == 'custbody_ta_opportunity_status') {
		var taval = nlapiGetFieldValue('custbody_ta_opportunity_status');
		var ordertype = nlapiGetFieldValue('custbody_order_type');
		if (taval == 1) {
			if (ordertype == 2) {
				nlapiSetFieldValue('entitystatus',132,true,true);	
			}
			else nlapiSetFieldValue('entitystatus',true,true);
		}
		else if (taval==2) {
			if (ordertype == 2) {
				nlapiSetFieldValue('entitystatus',135,true,true);
			}
			else nlapiSetFieldValue('entitystatus',13,true,true);
		}
		else if (taval==3) {
			if (ordertype == 2) {
				nlapiSetFieldValue('entitystatus',133,true,true);
			}
			else nlapiSetFieldValue('entitystatus',8,true,true);
		}
		else if (taval==4) {
			if (ordertype == 2) {
				nlapiSetFieldValue('entitystatus',134,true,true);
			}
			else nlapiSetFieldValue('entitystatus',119,true,true);
		}
		else if (taval==5) {
			nlapiSetFieldValue('entitystatus',130,true,true);
		}
		else if (taval==10) {
			if (ordertype == 2) {
				nlapiSetFieldValue('entitystatus',136,true,true);
			}
			else nlapiSetFieldValue('entitystatus',127,true,true);
		}
		else if (taval==11) {
			if (ordertype == 2) {
				nlapiSetFieldValue('entitystatus',135,true,true);
			}
			else nlapiSetFieldValue('entitystatus',13,true,true);
		}
	}
	
	if (name == 'custbody_ta_contract_to_upsell') {
		var upsell_contract = nlapiGetFieldValue('custbody_ta_contract_to_upsell');
		nlapiSetFieldValue('custbody_contract_name', upsell_contract, true);
	}
	
	if (name == 'custbody_contract_name'){
		var contractid = nlapiGetFieldValue('custbody_contract_name');
		if (isNotEmpty(contractid)){
			BodyFieldDisable('custbody_enddate');
		}
		else
			BodyFieldNormal('custbody_enddate');
	}
}
