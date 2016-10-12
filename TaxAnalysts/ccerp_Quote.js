/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Sep 2014     Dana
 *
 */


function Quote_BeforeLoad(type, form, request){
	nlapiLogExecution('debug', 'Quote_BeforeLoad ' + type);
	if (type=='delete'){
		return;
	}
	if (type == 'create' || type == 'edit'){
		var ordtype = nlapiGetFieldValue('custbody_order_type');
		if (ordtype == 2){
		BodyFieldInline('custbody_contract_name');
		}
	}
	if (type == 'view') {
		form.setScript('customscript_quote_client');
		var opid = nlapiGetFieldValue('opportunity');
		if(isNotEmpty(opid))
		form.addButton('custpage_UpdateOpp_btn', 'Update Opportunity', 'update_projected_total_btn()');	
	}
	
	//Set native Start and End Dates from custom fields on opportunity and if renewal set form to renewal notice
	//var ordertype = nlapiGetFieldValue('custbody_order_type');
	var opid = nlapiGetFieldValue('opportunity');
	if (type == 'create'){
		
		var cotermcontracts = nlapiGetFieldValues('cotermcontracts');
		if (isEmpty(cotermcontracts)){
			nlapiSetFieldValue('custbody_cotermcontracttotal','');
		}
		
		var ordtype = nlapiGetFieldValue('custbody_order_type');
		if (ordtype == 2)
			nlapiSetFieldValue('entitystatus',133);
		
		if (isNotEmpty(opid)){
			var opidVals = nlapiLookupField('opportunity', opid, ['custbody_startdate', 'custbody_enddate']);
			var startdate = opidVals['custbody_startdate'];
			var enddate = opidVals['custbody_enddate'];
			nlapiSetFieldValue('startdate',startdate);
			nlapiSetFieldValue('enddate',enddate);
		}
	}
}


function Quote_BeforeSubmit(type){
	nlapiLogExecution('debug', 'Quote_BeforeSubmit ' + type);
	if (type == 'delete')
		return;
	var customer = nlapiGetFieldValue('custbody_end_user');
	var tranenddate = nlapiGetFieldValue('enddate');
	var cotermcontracts = nlapiGetFieldValues('custbody_cotermcontracts');
	if (type=='create'){
		
		// Set from contract term used in ne math logic
		var fromcontract = nlapiGetFieldValue('custbody_swe_from_contract');
		if (isEmpty(fromcontract))
			nlapiSetFieldValue('custbody_ta_term_from_old_contract',1);
		else{ 
			var fromcontractterm = nlapiLookupField('customrecord_contracts', fromcontract, 'custrecord_contract_renewal_terms');
			nlapiSetFieldValue('custbody_ta_term_from_old_contract',fromcontractterm);
		}
		
		//Get Co-Term Contract items and load as items on quote.
		var uplift = (parseInt(nlapiLookupField('customer',customer,'custentity_uplift'))/100)+1;
		if(!isNumber(uplift))
			uplift = 1;
		nlapiLogExecution('debug','uplift '+uplift);
		
		if (isNotEmpty(cotermcontracts)){
			cifils = [new nlobjSearchFilter('custrecord_ci_contract_id', null, 'anyof',cotermcontracts)];
			var ciresults = nlapiSearchRecord(null, 'customsearch__co_term_contract_items',cifils);
			if (isNotEmpty(ciresults)){
				var cotermtot = 0;
				var cotermnewtot = 0;
				for(var i = 0; i < ciresults.length; i++){
					var ciid = ciresults[i].getId();
					var ciitem = ciresults[i].getValue('custrecord_ci_item');
					var cienddate = ciresults[i].getValue('custrecord_ci_enddate');
					var linestartdate = nlapiDateToString(nlapiAddDays(nlapiStringToDate(cienddate), 1));
					var lineenddate = tranenddate;
					var ciqty = ciresults[i].getValue('custrecord_ci_quantity');
					var lineterm = SWE.Library.dates.dateDiff(linestartdate,lineenddate);
					var olr = ciresults[i].getValue('custrecord_ci_original_list_rate_base');
					var cotermlineamunt = olr*lineterm*ciqty;
					var listrate = olr*uplift;
					var lineamount = (listrate*ciqty*lineterm);
					nlapiSelectNewLineItem('item');
					nlapiSetCurrentLineItemValue('item', 'item', ciitem);
					nlapiSetCurrentLineItemValue('item', 'quantity', ciqty);
					nlapiSetCurrentLineItemValue('item', 'amount', lineamount);
					nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_item_term_months', lineterm);
					nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_start_date', linestartdate);
					nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_end_date', lineenddate);
					nlapiSetCurrentLineItemValue('item', 'price', '-1');
					nlapiSetCurrentLineItemValue('item', 'custcol_cotermcontractitemvalue', lineamount);
					nlapiSetCurrentLineItemValue('item', 'custcol_list_rate', listrate);
					nlapiSetCurrentLineItemValue('item', 'custcol_cotermcontract_item', ciid);
					//nlapiSetCurrentLineItemValue('item', 'custcol_from_ci_id', ciid);
					nlapiCommitLineItem('item');
					cotermtot += lineamount;
					cotermnewtot += lineamount;
				}
				nlapiSetFieldValue('custbody_ta_coterm_amount_new',cotermnewtot);
				nlapiSetFieldValue('custbody_cotermcontracttotal',cotermtot);
			}
		}
	}
		
	if (type == 'edit'){
		if (isNotEmpty(cotermcontracts)){
		var cotermtot = 0;
		var cotermnewtot = 0;
			for(var i=1;i<=nlapiGetLineItemCount('item');i++){
				var ciid = nlapiGetLineItemValue('item', 'custcol_cotermcontract_item',i);
				if (isNotEmpty(ciid)){
					var cotermlineamount = MyParseFloat(nlapiGetLineItemValue('item','custcol_cotermcontractitemvalue',i));
					var cotermlinenewamount = MyParseFloat(nlapiGetLineItemValue('item','amount',i));
					cotermtot += cotermlineamount;
					cotermnewtot += cotermlinenewamount;
				}
			}
			nlapiSetFieldValue('custbody_cotermcontracttotal',cotermtot);
			nlapiSetFieldValue('custbody_ta_coterm_amount_new',cotermnewtot);
		}
	}
}


function Quote_AfterSubmit(type){
	nlapiLogExecution('debug', 'Quote_AfterSubmit ' + type);
	var opid = nlapiGetFieldValue('opportunity');
	if (type == 'delete'){
		if (isNotEmpty(opid)){
			var oprec = nlapiLoadRecord('opportunity', opid);
			var optranstatus = oprec.getFieldValue('status');
			oprec.setFieldValue('custbody_ta_total_renewal_amount','');
			oprec.setFieldValue('custbody_ta_trans_new_business','');
			oprec.setFieldValue('custbody_cotermcontracttotal','');
			if (optranstatus == 'inProgress')
				oprec.setFieldValue('custbody_ta_opportunity_status',1);
			nlapiSubmitRecord(oprec);
		}
	}
	
	if (type == 'create' || type == 'edit'){
		
		var ordertype = nlapiGetFieldValue('custbody_order_type');				
		var entitystatus = nlapiGetFieldValue('entitystatus');
		if (type == 'create' || (type == 'edit' && entitystatus == 8)){
			if (isNotEmpty(opid)){
				nlapiSubmitField('opportunity',opid,'custbody_ta_opportunity_status',3);
				nlapiLogExecution('debug','ordertype '+ordertype);
				if (ordertype == '2'){
					nlapiLogExecution('debug','68 ordertype '+ordertype);
					nlapiSubmitField('opportunity',opid,'entitystatus',133);
				}
				else
					nlapiSubmitField('opportunity',opid,'entitystatus',8);
			}
		}
		
		// Set up Variables for new and renewal business calcs
		var customer = nlapiGetFieldValue('custbody_end_user');
		var uplift = (parseInt(nlapiLookupField('customer',customer,'custentity_uplift'))/100)+1;
		if (!isNumber(uplift))
			uplift=1;
		var esid = nlapiGetRecordId();
		var disctot = MyParseFloat(nlapiGetFieldValue('discounttotal'));
		var newtot = MyParseFloat(nlapiGetFieldValue('total'));
		var fromcontractamt = MyParseFloat(nlapiGetFieldValue('custbody_renewedfromcontractvalue'))*uplift;
		var oldcotermtot = MyParseFloat(nlapiGetFieldValue('custbody_cotermcontracttotal'));
		var newcotermtot = MyParseFloat(nlapiGetFieldValue('custbody_ta_coterm_amount_new'));
		var oldterm = MyParseFloat(nlapiGetFieldValue('custbody_ta_term_from_old_contract'));
		var newterm = MyParseFloat(nlapiGetFieldValue('custbody_tran_term_in_months'));
		var oldrate = fromcontractamt/oldterm;
		var newrate = (newtot-newcotermtot)/newterm;
		var ratediff = newrate-oldrate;
		var cotermdiff = newcotermtot-oldcotermtot;
		nlapiLogExecution('debug','oldrate '+oldrate+' new rate '+newrate+'ratediff '+ratediff);
		
		
		//Calc New and Renewal Business for multi year deal with Billing Schedule
		var billsched = nlapiGetFieldValue('billingschedule');
		/*if (isNotEmpty(billsched)){
			var schedflds = [];
			schedflds.push('ispublic');
			schedflds.push('recurrencecount');
			var schedvals = nlapiLookupField('billingschedule',billsched,schedflds);
			var ispublic = schedvals['ispublic'];
			var numremaining = MyParseFloat(schedvals['recurrencecount']);
			var termyears = roundNumber(newterm/12,0);
		}*/
		if (ratediff < 0){
			var renbustot = newtot;
			var newbustot = 0;
		}
		else if (newterm > 12 && isNotEmpty(billsched)){ // && ispublic !='T' && termyears == numremaining ){
			var renbustot = 0;
			var newbustot = 0;
			var renamtvar = fromcontractamt+oldcotermtot;
			esrec = nlapiLoadRecord('estimate',esid);
			var bschedcount = esrec.getLineItemCount('billingschedule');
			nlapiLogExecution('debug','BillSchedcount '+bschedcount);
			renbustot = renamtvar;
			nlapiLogExecution('debug','renbustot '+renbustot);
			for (var i=1; i <= bschedcount; i++){
				bschedamount = MyParseFloat(esrec.getLineItemValue('billingschedule','billamount',i));
				nlapiLogExecution('debug','bschedamount '+bschedamount);
				newbustot += (bschedamount-renamtvar);
				if (i != bschedcount)
				renbustot += bschedamount;
				renamtvar = bschedamount;
				nlapiLogExecution('debug','newbustot '+bschedamount+'renbustot '+bschedamount+'renamtvar '+renamtvar+'renbustot '+renbustot);
				
			}
		}
		
		else{
		
			// Calc new business
			if (ratediff <= 0)
				ratediff = 0;
			// Removed By MB on 01/08/2015 To allow for proper calc of new business with a public billing schedule
			//if (newterm > 12)
				//newterm = 12;
			newbustot = ((ratediff*newterm)+cotermdiff);
			nlapiLogExecution('debug','newbustot '+newbustot+' ratediff '+ratediff+'disctot '+disctot);
			if (newbustot<0)
				newbustot=0;
			// Calc renewal business
			renbustot = newtot-newbustot;
		}
		
		nlapiSubmitField('estimate',esid,'custbody_ta_trans_new_business',newbustot);
		nlapiSubmitField('estimate',esid,'custbody_ta_total_renewal_amount',renbustot);
	}
	
}

function update_projected_total_btn(){
	var esid = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET', 'customscript_update_projected_total','customdeploy1');
	url += '&esid='+esid;
	window.open(url,'_self');
	
}

function update_projected_total_suitelet_2(request,response) {
	var esid = request.getParameter('esid');
	var esflds=[];
	esflds.push('opportunity','total');
	esvals = nlapiLookupField('estimate',esid,esflds);
	var opid = esvals['opportunity'];
	var estot = esvals['total'];
	nlapiSubmitField('opportunity',opid,'projectedtotal',estot);
	nlapiSetRedirectURL('RECORD','estimate',esid);
}

function update_projected_total_suitelet(request,response) {
	var esid = request.getParameter('esid');
	var esflds=[];
	var esvals=[];
	var opid = nlapiLookupField('estimate',esid,'opportunity');
	esflds.push('total','custbody_cotermcontracttotal','custbody_ta_total_renewal_amount','custbody_ta_trans_new_business');
	esvals = nlapiLookupField('estimate',esid,esflds);
	nlapiSubmitField('opportunity',opid,'custbody_ta_updated_from_quote',esid);
	nlapiSubmitField('opportunity',opid,'projectedtotal',esvals['total']);
	nlapiSubmitField('opportunity',opid,'custbody_cotermcontracttotal',esvals['custbody_cotermcontracttotal']);
	nlapiSubmitField('opportunity',opid,'custbody_ta_total_renewal_amount',esvals['custbody_ta_total_renewal_amount']);
	nlapiSubmitField('opportunity',opid,'custbody_ta_trans_new_business',esvals['custbody_ta_trans_new_business']);
	nlapiSubmitField('opportunity',opid,'custbody_ta_trans_new_business',esvals['custbody_ta_trans_new_business']);
	nlapiSetRedirectURL('RECORD','estimate',esid);
}
