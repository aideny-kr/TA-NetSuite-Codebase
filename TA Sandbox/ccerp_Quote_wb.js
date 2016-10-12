/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Sep 2014     Dana
 *
 */

function initPage() {
	AddJavascript('https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js', 'head');
	AddStyle('https://system.na1.netsuite.com/core/media/media.nl?id=460245&c=1257021&h=1dfd9023815b08328aab&_xt=.css','head');
}

function lineDelete(type) {
	var role = nlapiGetRole();
	if(type == 'item' && role != '3'){
		var cotermId = nlapiGetCurrentLineItemValue(type, 'custcol_cotermcontract_item');
		if(cotermId != ''){
			swal('Can\'t delete the line', 'The line you are trying to remove is from coterm contract. \n Instead of deleting the line, \n please set the item quantity as 0 and check on "No Display"', 'error');
			return false;
		}else{
			return true;
		}
	}else{
		return true;
	}
}

function submit_forapproval_btn(){
	var quid = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET', 'customscript_ccerp_qouteapproval', 'customdeploy1');
	url += '&quid='+quid;
	url += '&action=submit';
	window.open(url,'_self');
	
}

function qoute_approval_btn(){
	var quid = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET', 'customscript_ccerp_qouteapproval', 'customdeploy1');
	url += '&quid='+quid;
	url += '&action=approve';
	window.open(url,'_self');
	
}

function quote_reject_btn(){
	var quid = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET', 'customscript_ccerp_qouteapproval', 'customdeploy1');
	url += '&quid='+quid;
	url += '&action=reject';
	window.open(url,'_self');
	
}


function quote_approval_process(request,response){
	var context = nlapiGetContext();
	var quid = request.getParameter('quid');
	var action = request.getParameter('action');
	var qurec = nlapiLoadRecord('estimate', quid);
	var salesRep = qurec.getFieldValue('salesrep');
	var next_approver = qurec.getFieldValue('custbody_nextapprover');
	var next_approver_name = qurec.getFieldText('custbody_nextapprover')
	var sales_rep_name = qurec.getFieldText('salesrep');
	var supervisor = nlapiLookupField('employee',salesRep,'supervisor');
	var subject = 'A Quote needs your approval';
	var link = 'https://system.na1.netsuite.com';
	link += nlapiResolveURL('RECORD', 'estimate', quid);
	var msg = sales_rep_name + ' has submitted a quote and it needs your validation and approval.<br/>';
		msg += 'Please access the record from NetSuite to take further action.<br/>';
		msg += 'Thank you.<br/>';
		msg += '<strong>Customer : </strong>' + qurec.getFieldText('entity') + '<br/>';
		msg += '<strong>Quote Total :</stroing> $' + qurec.getFieldValue('total');
		msg += '<br/><br/>';
		msg += '<a href="'+ link +'">Take me to the quote</a>';
	var associate_rec = new Object();
	
	

	
	associate_rec['transaction'] = quid;
	if (action == 'submit'){
		qurec.setFieldValue('custbody_quoteapprovalstatus',1);
		qurec.setFieldValue('custbody_nextapprover',supervisor);
		nlapiSendEmail(salesRep, supervisor, subject, msg, null, null, associate_rec);
	}
	if (action == 'reject'){
		qurec.setFieldValue('custbody_quoteapprovalstatus',3);
		qurec.setFieldValue('custbody_sendquoteapproval_email','T');
	}
	if (action == 'approve'){
		qurec.setFieldValue('custpage_approvecheck','T');
		qurec.setFieldValue('custbody_sendquoteapproval_email','T');
	}

	nlapiSubmitRecord(qurec);
	nlapiSetRedirectURL('RECORD','estimate',quid);
}


function Quote_BeforeLoad(type, form, request){
	nlapiLogExecution('debug', 'Quote_BeforeLoad ' + type);
	if (type=='delete'){
		return;
	}
	if (type == 'create' || type =='copy'){
		var salesrep = nlapiGetFieldValue('salesrep');
		if(isEmpty(salesrep)){
			salesrep = nlapiGetUser();
		}
		nlapiSetFieldValue('custbody_nextapprover', salesrep);
		
	}
	if (type == 'create' || type == 'edit'){
		form.addField('custpage_approvecheck','checkbox').setDisplayType('hidden');
		var ordtype = nlapiGetFieldValue('custbody_order_type');
		if (ordtype == 2){
		BodyFieldInline('custbody_contract_name');
		}
	}
	if (type == 'view') {
		form.setScript('customscript_quote_client');
		var contractTerm = nlapiGetFieldValue('custbody_tran_term_in_months');
		var documentStatus = nlapiGetFieldValue('status');
		if(contractTerm == '12' & (documentStatus == "Open" || documentStatus == "Processed" )){
			form.addButton('custpage_Multiyear_btn', 'Multi-Year Assistance', 'suitelet_multiyear_call_btn()');
		}
		var opid = nlapiGetFieldValue('opportunity');
		if(isNotEmpty(opid))
		
		////////////////////Quote Approval Process///////////////////
		/*
		Pending Submission - 4
		Pending Approval - 1
		Approved - 2
		Rejected - 3
		*/
		var role = nlapiGetRole();
		var user = nlapiGetUser();
		var nextApprover = nlapiGetFieldValue('custbody_nextapprover');
		var approvalStatus = nlapiGetFieldValue('custbody_quoteapprovalstatus');
		if (approvalStatus != '2' && (user != '17823' && user != '17634')){
			form.removeButton('custpage_button_docusign_send');
			form.removeButton('createsalesord');
			form.removeButton('print');
		}
		if (approvalStatus == '4' || approvalStatus == '3'){
			form.addButton('custpage_submitApproval_btn','Submit For Approval', 'submit_forapproval_btn()');
		}
		if (approvalStatus != '2' && (user != '17823' && user != '17634')){
			if((approvalStatus == '1' && user == nextApprover) || role == 3){
				form.addButton('custpage_qoute_approval_btn','Approve', 'qoute_approval_btn()');
				form.addButton('custpage_quote_reject_btn','Reject', 'quote_reject_btn()');
			}
		}
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
		
		if(nlapiGetField('custbody_print_as') && isNotEmpty(nlapiGetFieldValue('entity'))){
			if(ordtype == '1' || ordtype == '3'){
				nlapiSetFieldValue('custbody_print_as', '3');
			}
			else if(ordtype == '2'){
				nlapiSetFieldValue('custbody_print_as', '1');
			}
			else if(nlapiLookupField('customer', nlapiGetFieldValue('entity'), 'custentity_esc_industry') == '17'){
				nlapiSetFieldValue('custbody_print_as', '2');
			}
			else{
				nlapiSetFieldValue('custbody_print_as', '3');
			}
		}else{
			nlapiSetFieldValue('custbody_print_as', '3');
		}
		
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
	var context = nlapiGetContext();
	if (type == 'delete' || type == 'edit'){
		//Search for related new business records and delete.  Records will be recreated after submit
		esid = nlapiGetRecordId();
		var nbfils = [];
		nbfils.push(new nlobjSearchFilter('custrecord_newbus_txn',null,'anyof',esid));
		var nbResults = nlapiSearchRecord('customrecord_newbus',null,nbfils);
		if (isNotEmpty(nbResults)){
			for (var nb = 0; nb<nbResults.length;nb++){
				var nbid = nbResults[nb].getId();
				nlapiDeleteRecord('customrecord_newbus',nbid);
			}
		}
	}
	if (type == 'create' || type == 'edit'){
		var role = nlapiGetRole();
		var user = nlapiGetUser();
		var salesRep = nlapiGetFieldValue('salesrep');
		var nextApprover = nlapiGetFieldValue('custbody_nextapprover');
		var customer = nlapiGetFieldValue('custbody_end_user');
		var industry = nlapiLookupField('entity',customer,'custentity_esc_industry');
		var tranenddate = nlapiGetFieldValue('enddate');
		var newBusCheck = nlapiGetFieldValue('custbody_order_type');
		var cotermcontracts = nlapiGetFieldValues('custbody_cotermcontracts');
		var subtot = MyParseFloat(nlapiGetFieldValue('subtotal'));
		var txndiscount = MyParseFloat(nlapiGetFieldValue('discounttotal'));
		var discmult = (1+(txndiscount/subtot));
		//Evaluate quote approval
		var approvalCheck = nlapiGetFieldValue('custpage_approvecheck');
		if (approvalCheck == 'T'){
			nlapiSetFieldValue('custpage_approvecheck','F');
			//nextApprover = nlapiLookupField('Employee',user,'supervisor');
		}
		var newTot = MyParseFloat(nlapiGetFieldValue('total'));
		var oldTot = 0;
		if (type == 'edit'){
			var oldRec = nlapiGetOldRecord();
			oldTot = MyParseFloat(oldRec.getFieldValue('total'));
			nlapiLogExecution('debug','oldTot '+oldTot);
		}
		var supervisor = '';
		if (newTot != oldTot || approvalCheck == 'T' || type == 'create'){
			if (newTot != oldTot){
				if(user == '17823' || user == '17634'){
					nextApprover = user;
				}else{
					nextApprover = salesRep;
				}
			}
			var customer = nlapiGetFieldValue('entity');
			var contractTerm = MyParseFloat(nlapiGetFieldValue('custbody_tran_term_in_months'));
			var nextApproverFlds = ['custentity_one_yr_approvallimit','custentity_multi_yr_approvallimit','custentity_disc_approvallimit','supervisor'];
			var nextApproverVals = nlapiLookupField('employee',nextApprover,nextApproverFlds);
			if (approvalCheck == 'T')
				supervisor = nextApproverVals['supervisor'];
			else
				supervisor = nextApprover;
			var oneYrLimit = MyParseFloat(nextApproverVals['custentity_one_yr_approvallimit']);
			var multiYrLimit = MyParseFloat(nextApproverVals['custentity_multi_yr_approvallimit']);
			var discLimit = MyParseFloat(nextApproverVals['custentity_disc_approvallimit'])/100;
			nlapiLogExecution('debug','approvalCheck '+approvalCheck);
			//loop through lines and get listRate * term and compaire to customer price level on item
			var count = nlapiGetLineItemCount('item');
			var custtot = 0;
			for (var i = 1; i<=count; i++){
				var item = nlapiGetLineItemValue('item','item',i);
				var lineQty = MyParseFloat(nlapiGetLineItemValue('item','quantity',i));
				var lineTerm = MyParseFloat(nlapiGetLineItemValue('item','custcol_swe_contract_item_term_months',i));
				var pricelevel = nlapiGetLineItemValue('item','price',i);
				if (pricelevel == '10')
					continue;
				var customerItemRate = ccerpGetCustomerQtyRate(customer, item, lineQty);
				nlapiLogExecution('debug','customerItemRate '+customerItemRate);
				var custLineAmount = (customerItemRate/12)*lineTerm*lineQty;
				nlapiLogExecution('debug','custLineAmount '+custLineAmount+' lineTerm '+lineTerm+' lineQty '+lineQty);
				custtot += custLineAmount;
				nlapiLogExecution('debug','custtot '+custtot);
			}
			var trandiscrate = 0;
			if (newTot > 0)
				trandiscrate = ((newTot/custtot)-1)*-1;
			nlapiLogExecution('debug','trandiscrate '+trandiscrate+' discLimit '+discLimit);
			var __INDUSTRIES_DONOT_EVAL = [35,37];//35 - University/Library & 37 - Non-Profits
			var needsApproval = false;
			
			
		
			if (__INDUSTRIES_DONOT_EVAL.indexOf(industry)==-1 && trandiscrate > discLimit && newBusCheck == '1'){
				needsApproval = true;
			}
			else if (newTot > oneYrLimit && contractTerm <= 18 && newBusCheck == '1'){
				needsApproval = true;
			}
			else if (newTot > multiYrLimit && contractTerm > 18 && newBusCheck == '1'){
				needsApproval = true;
			}
			if (needsApproval == true){
				if (approvalCheck != 'T')
					nlapiSetFieldValue('custbody_quoteapprovalstatus',4);
				nlapiSetFieldValue('custbody_nextapprover',supervisor);
			}
			else{
				nlapiSetFieldValue('custbody_quoteapprovalstatus',2);
			}
		}
		
		
		if (isNotEmpty(cotermcontracts)){
			nlapiLogExecution('debug','cotermcontracts '+cotermcontracts);
			var uplift = (parseInt(nlapiLookupField('customer',customer,'custentity_uplift'))/100)+1;//may be removing
			if(!isNumber(uplift))
				uplift = 1;
			var oldannualcotermtot = 0;
			for (var c in cotermcontracts){
				var annualcotermamt = MyParseFloat(nlapiLookupField('customrecord_contracts',cotermcontracts[c],'custrecord_swe_annual_contract_val_gross'));
				oldannualcotermtot += (annualcotermamt);//*uplift); Uplift Removed per MB
			}	
			nlapiSetFieldValue('custbody_fromcotermannualvalue',oldannualcotermtot);
			nlapiLogExecution('debug','uplift '+uplift);
		}
		
		//****** setting up TNL Business value **********//
		
		var itemsToLookup = [2068,2069,2071,2076];
		var tnlTotal = 0;
		for(var i = 1; i <= nlapiGetLineItemCount('item'); i++){
			var tnlItem = nlapiGetLineItemValue('item','item',i);
			
			if(itemsToLookup.indexOf(tnlItem*1) > -1){
				tnlTotal += MyParseFloat(nlapiGetLineItemValue('item', 'amount', i));
				var discount = nlapiGetFieldValue('discountrate');
				if(isNotEmpty(discount)){
					if(discount.indexOf('%') > -1){
						tnlTotal = tnlTotal * ((100 + parseFloat(discount))/100);
					}else{
						var trans_total = parseFloat(nlapiGetFieldValue('subtotal'));
						var disc_pct = ((trans_total + parseFloat(discount))/trans_total);
						tnlTotal = tnlTotal * disc_pct;
					}
				}
				nlapiLogExecution('DEBUG', 'tnlItem', 'Amount = ' + tnlTotal + ", tnlItem = " + tnlItem);
			}
		}
		nlapiSetFieldValue('custbody_tnl_business', tnlTotal);
		
		if (type=='create'){
			
			// Set from contract term used in new math logic
			var fromcontract = nlapiGetFieldValue('custbody_swe_from_contract');
			if (isEmpty(fromcontract))
				nlapiSetFieldValue('custbody_ta_term_from_old_contract',1);
			else{ 
				var fromcontractterm = nlapiLookupField('customrecord_contracts', fromcontract, 'custrecord_contract_renewal_terms');
				nlapiSetFieldValue('custbody_ta_term_from_old_contract',fromcontractterm);
			}
			
			//Get Co-Term Contract items and load as items on quote.
			
			if (isNotEmpty(cotermcontracts)){
				
				cifils = [new nlobjSearchFilter('custrecord_ci_contract_id', null, 'anyof',cotermcontracts)];
				var ciresults = nlapiSearchRecord(null, 'customsearch__co_term_contract_items',cifils);
				if (isNotEmpty(ciresults)){
					var cotermtot = 0;
					var cotermnewtot = 0;
					var newannualcotermtot = 0;
					for(var i = 0; i < ciresults.length; i++){
						var contractId = ciresults[i].getValue('custrecord_ci_contract_id');
						var ciid = ciresults[i].getId();
						var ciitem = ciresults[i].getValue('custrecord_ci_item');
						var cienddate = ciresults[i].getValue('custrecord_ci_enddate');
						var linestartdate = nlapiDateToString(nlapiAddDays(nlapiStringToDate(cienddate), 1));
						var lineenddate = tranenddate;
						var qty = ccerpGetContractItemsQty(contractId,ciitem);
						nlapiLogExecution('debug','JSON.String.qty',JSON.stringify(qty));
						var ciqty = qty[0].ciqty;
						if (ciqty <= 0)
							continue;
						nlapiLogExecution('debug','ciqty',ciqty);
						var lineterm = roundNumber(SWE.Library.dates.dateDiff(linestartdate,lineenddate),3);
						var olr = ciresults[i].getValue('custrecord_ci_original_list_rate_base');
						var cotermlineamunt = olr*lineterm*ciqty;
						var listrate = olr*uplift;
						var lineamount = (olr*ciqty*lineterm);//Removed uplift 09/17/2015 changed to olr* from listrate*
						var newannualcotermline = (listrate*ciqty*12)*discmult;
						var oldannualcotermline = olr*ciqty*12;
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
						nlapiSetCurrentLineItemValue('item', 'custcol_from_ci_id', ciid);
						nlapiCommitLineItem('item');
						cotermtot += lineamount;
						cotermnewtot += lineamount;
						newannualcotermtot += newannualcotermline;
						
					}
					nlapiSetFieldValue('custbody_ta_coterm_amount_new',cotermnewtot);
					nlapiSetFieldValue('custbody_cotermcontracttotal',cotermtot);
					nlapiSetFieldValue('custbody_newcotermannualvalue',newannualcotermtot);
					//nlapiSetFieldValue('custbody_fromcotermannualvalue',oldannualcotermtot);
				}
			}
		}
		
		if (type == 'edit'){
			var sendApprovalEmailFlag = nlapiGetFieldValue('custbody_sendquoteapproval_email');
			//var esid = nlapiGetRecordId();
			if (sendApprovalEmailFlag == 'T')
				nlapiSetFieldValue('custbody_sendquoteapproval_email','F');
			//Get the Sales rep Uplift and set on the Quote - Waiting for Jamie
			var salesRepUplift = nlapiGetFieldValue('custbody_salesrep_upliftpct');
			if (isEmpty(salesRepUplift)){
				var salesrep = nlapiGetFieldValue('salesrep');
				if(isNotEmpty(salesrep)){
				var salesrepupliftpct = nlapiLookupField('employee',salesrep,'custentity_newbus_upliftpct');
				if (isNotEmpty(salesrepupliftpct));
					nlapiSetFieldValue('custbody_salesrep_upliftpct',salesrepupliftpct);
				}	
			}
			//calc coterm line
			if (isNotEmpty(cotermcontracts)){
			var cotermtot = 0;
			var cotermnewtot = 0;
			var newannualcotermtot = 0;
			ciidArr = [];	
				for(var i=1;i<=nlapiGetLineItemCount('item');i++){
					var ciid = nlapiGetLineItemValue('item', 'custcol_cotermcontract_item',i);
					if (isNotEmpty(ciid) && ciidArr.indexOf(ciid) == -1){
						ciidArr.push(ciid);
						var lineterm = nlapiGetLineItemValue('item','custcol_swe_contract_item_term_months',i);
						var cotermlineamount = MyParseFloat(nlapiGetLineItemValue('item','custcol_cotermcontractitemvalue',i));
						var cotermlinenewamount = MyParseFloat(nlapiGetLineItemValue('item','amount',i))*discmult;
						nlapiLogExecution('debug','cotermlinenewamount '+cotermlinenewamount);
						cotermtot += cotermlineamount;
						cotermnewtot += cotermlinenewamount;
						newannualcotermtot += (cotermlinenewamount/lineterm)*12;
					}
				}
				
				nlapiSetFieldValue('custbody_cotermcontracttotal',cotermtot);
				nlapiSetFieldValue('custbody_ta_coterm_amount_new',cotermnewtot);
				nlapiSetFieldValue('custbody_newcotermannualvalue',newannualcotermtot);
			}
		}
		
		// Add S&H if any of the print is in any line
		// S&H-D = 2074, S&H-I = 2075
		(function(){
			var context = nlapiGetContext();
			var shipping_items = ['2074', '2075'];
			var item_count = nlapiGetLineItemCount('item');
			var ship_country = nlapiGetFieldValue('shipcountry');
			var print_items = getPrintItemArray();
			var print_count = 0;
			var start_date = nlapiGetFieldValue('startdate');
			var end_date = nlapiGetFieldValue('enddate');
			var term = nlapiGetFieldValue('custbody_tran_term_in_months');
			var is_already_charged = false;
			nlapiLogExecution('DEBUG', 'Print Items', print_items);
			
			// skip this process if Execution Context is Import Process
			
			if(context.getExecutionContext() != 'csvimport'){
			var print_total_rate = 0;
				for(var i = 1; i <= item_count; i += 1){
					var item_id = nlapiGetLineItemValue('item', 'item', i);
					
					if( shipping_items.indexOf(item_id) > -1 ){
						is_already_charged = true;
					}
					if(print_items.indexOf(item_id) > -1){
						print_count += 1;
						print_total_rate += parseFloat(nlapiGetLineItemValue('item', 'amount', i));
					}
				}
				

				
				nlapiLogExecution('DEBUG', 'S&H Validation', 'is_already_charged: ' + is_already_charged + '. print_count: ' + print_count);
				if(print_count > 0 && print_total_rate > 0 && is_already_charged == false){
					// if the quote is multi-year charge shipping for each billing schedule
					if(parseFloat(term) > 16){
						
						// future update : Handle Subtotal Line
						
						for (var i = 1; i <= item_count; i +=1){
							var curr_bill_sched = nlapiGetLineItemValue('item', 'billingschedule', i);
							var curr_item = nlapiGetLineItemValue('item', 'item', i);
							if(i > 1) {
								var prev_bill_sched = nlapiGetLineItemValue('item', 'billingschedule', i - 1);
								nlapiLogExecution('DEBUG', 'inside loop of S&H multiyear', prev_bill_sched);
								var prev_start_date = nlapiGetLineItemValue('item', 'custcol_swe_contract_start_date', i - 1);
								var prev_end_date = nlapiGetLineItemValue('item', 'custcol_swe_contract_end_date', i - 1);
								var prev_term = nlapiGetLineItemValue('item', 'custcol_swe_contract_item_term_months', i - 1);
								var prev_item = nlapiGetLineItemValue('item', 'item', i - 1);
								
								var curr_start_date = nlapiGetLineItemValue('item', 'custcol_swe_contract_start_date', i);
								var curr_end_date = nlapiGetLineItemValue('item', 'custcol_swe_contract_end_date', i);
								var curr_term = nlapiGetLineItemValue('item', 'custcol_swe_contract_item_term_months', i);
								nlapiLogExecution('DEBUG', 'Index Of "-" in Curr_item', curr_item + ', ' + curr_item.indexOf('-'));
								
									
									if((curr_bill_sched != prev_bill_sched) && prev_bill_sched == null){
										
										// first year charge for shipping 
										nlapiSelectNewLineItem('item');
										ship_country == 'US' ? nlapiSetCurrentLineItemValue('item', 'item', '2074', true, true):nlapiSetCurrentLineItemValue('item', 'item', '2075', true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_start_date', prev_start_date, true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_end_date', prev_end_date, true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_item_term_months', prev_term, true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_renewals_exclusion', 'T', true, true);
										ship_country == 'US' ? nlapiSetCurrentLineItemValue('item', 'custcol_list_rate', 50/parseFloat(prev_term), true, true):nlapiSetCurrentLineItemValue('item', 'custcol_list_rate', 100/parseFloat(prev_term), true, true);
										nlapiCommitLineItem('item');
										
										// second year charge for shipping
										nlapiSelectNewLineItem('item');
										ship_country == 'US' ? nlapiSetCurrentLineItemValue('item', 'item', '2074', true, true):nlapiSetCurrentLineItemValue('item', 'item', '2075', true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_start_date', curr_start_date, true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_end_date', curr_end_date, true, true);
										nlapiSetCurrentLineItemValue('item', 'billingschedule', curr_bill_sched, true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_item_term_months', prev_term, true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_renewals_exclusion', 'T', true, true);
										ship_country == 'US' ? nlapiSetCurrentLineItemValue('item', 'custcol_list_rate', 50/parseFloat(prev_term), true, true):nlapiSetCurrentLineItemValue('item', 'custcol_list_rate', 100/parseFloat(prev_term), true, true);
										nlapiCommitLineItem('item');
									}
									
									// sets new line to charge shipping
									if((curr_bill_sched != prev_bill_sched) && isNotEmpty(prev_bill_sched)){
										nlapiSelectNewLineItem('item');
										ship_country == 'US' ? nlapiSetCurrentLineItemValue('item', 'item', '2074', true, true):nlapiSetCurrentLineItemValue('item', 'item', '2075', true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_start_date', curr_start_date, true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_end_date', curr_end_date, true, true);
										nlapiSetCurrentLineItemValue('item', 'billingschedule', curr_bill_sched, true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_swe_contract_item_term_months', prev_term, true, true);
										nlapiSetCurrentLineItemValue('item', 'custcol_renewals_exclusion', 'T', true, true);
										ship_country == 'US' ? nlapiSetCurrentLineItemValue('item', 'custcol_list_rate', 50/parseFloat(prev_term), true, true):nlapiSetCurrentLineItemValue('item', 'custcol_list_rate', 100/parseFloat(prev_term), true, true);
										nlapiCommitLineItem('item');
									}
								
								}
								
						}
					}
					else{
						if(ship_country == 'US'){
							nlapiSetLineItemValue('item', 'item', item_count + 1, '2074');
							nlapiSetLineItemValue('item', 'custcol_swe_contract_start_date', item_count + 1, start_date);
							nlapiSetLineItemValue('item', 'custcol_swe_contract_end_date', item_count + 1, end_date);
							nlapiSetLineItemValue('item', 'custcol_swe_contract_item_term_months', item_count + 1, term);
							nlapiSetLineItemValue('item', 'custcol_list_rate', item_count + 1, 50/parseInt(term));
							nlapiSetLineItemValue('item', 'custcol_renewals_exclusion', item_count + 1,'T');
							
						}else{
							nlapiSetLineItemValue('item', 'item', item_count + 1, '2075');
							nlapiSetLineItemValue('item', 'custcol_swe_contract_start_date', item_count + 1, start_date);
							nlapiSetLineItemValue('item', 'custcol_swe_contract_end_date', item_count + 1, end_date);
							nlapiSetLineItemValue('item', 'custcol_swe_contract_item_term_months', item_count + 1, term);
							nlapiSetLineItemValue('item', 'custcol_list_rate', item_count + 1, 100/parseInt(term));
							nlapiSetLineItemValue('item', 'custcol_renewals_exclusion', item_count + 1,'T');
						}
					}	
				}
			}

			
		})();
	}
}


function Quote_AfterSubmit(type){
	var sendApprovalEmailFlag = nlapiGetFieldValue('custbody_sendquoteapproval_email');
	var esid = nlapiGetRecordId();
	var context = nlapiGetContext();
	var salesRep = nlapiGetFieldValue('salesrep');
	var sales_rep_name = nlapiGetFieldText('salesrep');
	var nextApprover = nlapiGetFieldValue('custbody_nextapprover');
	if (sendApprovalEmailFlag == 'T')
		nlapiSubmitField('estimate',esid,'custbody_sendquoteapproval_email','F');
	nlapiLogExecution('debug', 'Quote_AfterSubmit ' + type);
	nlapiLogExecution('DEBUG', 'Context', context.getExecutionContext());
	var opid = nlapiGetFieldValue('opportunity');
	if (type == 'delete' && isNotEmpty(opid)){
		
		// search for other quote for same opportunity
		var srchFlt = [new nlobjSearchFilter('mainline', null, 'is', 'T'),
		               new nlobjSearchFilter('opportunity', null, 'is', opid)];
		var srchClm = [new nlobjSearchColumn('internalid'),
		               new nlobjSearchColumn('total')];
		var srchRst = nlapiSearchRecord('estimate', null, srchFlt, srchClm);
		
		var esids = [];
		var totals = [];
		
		if(isNotEmpty(srchRst)){
			var replace_esid = getLowestQuote(opid);
			
			nlapiLogExecution('Debug', 'AfterSubmit: Delete', 'replacing esid on the opp = ' + replace_esid);
			
			var esflds=[];
			var esvals=[];
			esflds.push('total','custbody_cotermcontracttotal','custbody_ta_total_renewal_amount','custbody_ta_trans_new_business');
			esvals = nlapiLookupField('estimate',replace_esid,esflds);
			nlapiSubmitField('opportunity',opid,'custbody_ta_updated_from_quote',replace_esid);
			nlapiSubmitField('opportunity',opid,'projectedtotal',esvals['total']);
			nlapiSubmitField('opportunity',opid,'custbody_cotermcontracttotal',esvals['custbody_cotermcontracttotal']);
			nlapiSubmitField('opportunity',opid,'custbody_ta_total_renewal_amount',esvals['custbody_ta_total_renewal_amount']);
			nlapiSubmitField('opportunity',opid,'custbody_ta_trans_new_business',esvals['custbody_ta_trans_new_business']);
			nlapiSubmitField('opportunity',opid,'custbody_ta_trans_new_business',esvals['custbody_ta_trans_new_business']);
		}
		else{
			var oprec = nlapiLoadRecord('opportunity', opid);
			var optranstatus = oprec.getFieldValue('status');
			oprec.setFieldValue('custbody_ta_total_renewal_amount','');
			oprec.setFieldValue('custbody_ta_trans_new_business','');
			oprec.setFieldValue('custbody_cotermcontracttotal','');
			if (optranstatus == 'inProgress') oprec.setFieldValue('custbody_ta_opportunity_status',1);
			nlapiSubmitRecord(oprec);	
		}
	}
	
	
	
	if (type == 'create' || type == 'edit'){
		
		var soid = nlapiGetRecordId();
		var oldSoid = nlapiGetOldRecord();
		
		var ordertype = nlapiGetFieldValue('custbody_order_type');				
		var entitystatus = nlapiGetFieldValue('entitystatus');
		var nextApprover = nlapiGetFieldValue('custbody_nextapprover');
		var salesRep = nlapiGetFieldValue('salesrep');
		var approvalStatus = nlapiGetFieldValue('custbody_quoteapprovalstatus');
		var sales_rep_name = nlapiGetFieldText('salesrep');
		
		// update quote status on csv import
//		if(context.getExecutionContext() == 'csvimport'){
//			nlapiLogExecution('debug', 'Quote Status Clean Up Begins', context.getExecutionContext());
//			var link_id = nlapiGetLineItemValue('links','id', 1);
//			nlapiLogExecution('debug', 'Link ID', link_id);
//			if(entitystatus == '13' && isNotEmpty(link_id)){ //13 is closed won
//				var filters = [];
//				filters.push(new nlobjSearchFilter('opportunity', null, 'is', opid));
//				filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
//				filters.push(new nlobjSearchFilter('entitystatus', null, 'anyof', ['133', '8', '13']));
//				var result = nlapiSearchRecord('estimate', null, filters);
//				if(isNotEmpty(result)){
//					for(var i = 0; i < result.length; i += 1){
//						var result_esid = result[i].getId();
//						if(result_esid != esid){ 
//							nlapiSubmitField('estimate', result_esid, ['entitystatus', 'status'], ['140', 'Closed']);
//						}
//					}
//				}
//			}
//				
//		}
		
		// LINK FOR Anchor Tag in Emails
		var link = 'https://system.na1.netsuite.com';
		link += nlapiResolveURL('RECORD', 'estimate', nlapiGetRecordId());
		
		//*** sending emails to Libby for approval ***//
		if (approvalStatus == '1' && nextApprover == '51716' && context.getExecutionContext() == 'suitelet'){
			var subject = 'A Quote needs your approval';

			var msg = sales_rep_name + ' has submitted a quote and it needs your validation and approval.<br/>';
			msg += 'Please access the record from NetSuite to take further action.<br/>';
			msg += 'Thank you.<br/>';
			msg += '<strong>Customer : </strong>' + nlapiGetFieldText('entity') + '<br/>';
			msg += '<strong>Quote Total :</stroing> $' + nlapiGetFieldValue('total');
			msg += '<br/><br/>';
			msg += '<a href="'+ link +'">Take me to the quote</a>';
			var associate_rec = new Object();
			associate_rec['transaction'] = nlapiGetRecordId();
			nlapiSendEmail(salesRep, nextApprover, subject, msg, null, null, associate_rec);
		}
		
		// SEND EMAIL for Sales REP
		
		if ( approvalStatus == '2' && context.getExecutionContext() == 'suitelet' && oldSoid.getFieldValue('custbody_quoteapprovalstatus') == '1') {
			var approvedSubject = 'Your Quote has been approved';
			var approvedMsg = nlapiGetFieldText('custbody_nextapprover') + ' has approved your quote.' + nlapiGetFieldText('entity') + '<br/>';
			approvedMsg += 'Depending on the value of transaction total or discount rate, it might needs another approval.<br/>';
			approvedMsg += 'Otherwise, your quote(estimate) is good to go!<br/><br/>';
			approvedMsg += '<a href="'+ link +'">Take me to the quote</a>';
			nlapiSendEmail(8100, salesRep, approvedSubject, approvedMsg);
		}
		
		
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
		//var customer = nlapiGetFieldValue('custbody_end_user');
		var uplift = (parseInt(nlapiGetFieldValue('custbody_salesrep_upliftpct'))/100)+1;
		if (!isNumber(uplift) || uplift == 0)
			uplift=1;
		var esid = nlapiGetRecordId();
		var disctot = MyParseFloat(nlapiGetFieldValue('discounttotal'));
		var newtot = MyParseFloat(nlapiGetFieldValue('total'));
		var subtot = MyParseFloat(nlapiGetFieldValue('subtotal'));
		var discmult = (1+(disctot/subtot));
		var fromcontractamt = MyParseFloat(nlapiGetFieldValue('custbody_renewedfromcontractvalue'))*uplift;
		var oldcotermtot = MyParseFloat(nlapiGetFieldValue('custbody_cotermcontracttotal'));
		var newcotermtot = MyParseFloat(nlapiGetFieldValue('custbody_ta_coterm_amount_new'));
		var newcotermannualvalue = MyParseFloat(nlapiGetFieldValue('custbody_newcotermannualvalue'));
		var oldcotermannualtot = MyParseFloat(nlapiGetFieldValue('custbody_fromcotermannualvalue'));
		var oldterm = MyParseFloat(nlapiGetFieldValue('custbody_ta_term_from_old_contract'));
		var newterm = MyParseFloat(nlapiGetFieldValue('custbody_tran_term_in_months'));
		var oldrate = (((fromcontractamt/12)*oldterm)/oldterm);
		var newrate = roundNumber(newtot-newcotermtot)/newterm;
		var ratediff = newrate-oldrate;
		var cotermdiff = newcotermtot-oldcotermtot;
		var cotermcontracts = nlapiGetFieldValues('custbody_cotermcontracts');
		var annualdiff = (newrate*12)-(oldrate*12);
		var renbustot = 0;
		var newbustot = 0;
		// Getting contract end date in Date Object
		var contract_end_date = nlapiStringToDate(nlapiGetFieldValue('enddate'));
		var contract_term = nlapiGetFieldValue('custbody_tran_term_in_months');
		var renewal_date;
		var contract_start_date = nlapiGetFieldValue('startdate');
		
		nlapiLogExecution('debug','oldrate '+oldrate+' new rate '+newrate+'ratediff '+ratediff);
		
		// formula to get months to reduce
		function getReduction(i, bschedcount) {
			if (i > bschedcount) return 0;
			else return -(12+((+bschedcount - i) * 12));
		}
		
		//Calc New and Renewal Business for multi year deal with Billing Schedule
		var billsched = nlapiGetFieldValue('billingschedule');
		esrec = nlapiLoadRecord('estimate',esid);
		var bschedcount = esrec.getLineItemCount('billingschedule');
		
		//Copy billing schedule and set on comment	
		if(bschedcount > 1) {
			var message = copyBillschedToComment(esid, bschedcount);
			esrec.setFieldValue('message', message);
			nlapiSubmitField('estimate', esid, 'message', message, false);
		}
		
		//no coterm and new rate < old rate
		if (ratediff < 0 && newterm == oldterm){
			newbustot = newcotermannualvalue-oldcotermannualtot;
			if (newbustot < 0){
				renbustot = newtot;
			}
		}
		// Multi Year w/billing sched and co-term
		else if (newterm > 12 && bschedcount > 1 && isNotEmpty(cotermcontracts)){ // && ispublic !='T' && termyears == numremaining ){
			var renamtvar = ((fromcontractamt+oldcotermannualtot))+(newcotermtot-newcotermannualvalue);
			nlapiLogExecution('debug','BillSchedcount '+bschedcount);

			//renbustot = renamtvar;
			nlapiLogExecution('debug','227 renbustot '+renbustot);
			for (var i=1; i <= bschedcount; i++){
				bschedamount = MyParseFloat(esrec.getLineItemValue('billingschedule','billamount',i));
				bscheddate = esrec.getLineItemValue('billingschedule','billdate',i);
				nlapiLogExecution('debug','bscheddate '+bscheddate);				
				nlapiLogExecution('debug','230bschedamount '+bschedamount);
				newbustot += (bschedamount-renamtvar);
				
				
				// For first year, if the contract term is not in 12 months terms, use the contract startdate
				if(i == 1){
					renewal_date = (contract_term % 12 == 0) ? nlapiDateToString(nlapiAddMonths(contract_end_date, getReduction(i, bschedcount))) : nlapiDateToString(nlapiAddDays(nlapiStringToDate(contract_start_date), -1)); 
				}
				else {
					renewal_date = nlapiDateToString(nlapiAddMonths(contract_end_date, getReduction(i, bschedcount))); 
				}	
				// Create new business record
				
				var newbusrec = nlapiCreateRecord('customrecord_newbus');
				newbusrec.setFieldValue('custrecord_newbus_date',bscheddate);
				newbusrec.setFieldValue('custrecord_newbus_txn',esid);
				newbusrec.setFieldValue('custrecord_newbus_renewal_amount', renamtvar);
				newbusrec.setFieldValue('custrecord_newbus_amount',(bschedamount-renamtvar));
				newbusrec.setFieldValue('custrecord_newbus_renewal_date', renewal_date);
				nlapiSubmitRecord(newbusrec);
				nlapiLogExecution('debug','235 newbustot '+newbustot+'bschedamount '+bschedamount+'renamtvar '+renamtvar+'renbustot '+renbustot);
				renamtvar = bschedamount;
				
			}
		}
		
		// Multi Year w/billing sched
		else if (newterm > 12 && bschedcount > 1 && isEmpty(cotermcontracts)){ // && ispublic !='T' && termyears == numremaining ){
			var renamtvar = fromcontractamt;
			esrec = nlapiLoadRecord('estimate',esid);
			var bschedcount = esrec.getLineItemCount('billingschedule');
			
			renbustot = renamtvar;
			
			nlapiLogExecution('debug','renbustot '+renbustot);
			for (var i=1; i <= bschedcount; i++){
				
				renewal_date = nlapiDateToString(nlapiAddMonths(contract_end_date, getReduction(i, bschedcount))); 
				nlapiLogExecution('DEBUG', 'Renewal Date', renewal_date);
				
				bschedamount = MyParseFloat(esrec.getLineItemValue('billingschedule','billamount',i));
				bscheddate = esrec.getLineItemValue('billingschedule','billdate',i);
				nlapiLogExecution('debug','bschedamount '+bschedamount);
				newbustot += (bschedamount-renamtvar);
				
				// For first year, if the contract term is not in 12 months terms, use the contract startdate
				if(i == 1){
					renewal_date = (contract_term % 12 == 0) ? nlapiDateToString(nlapiAddMonths(contract_end_date, getReduction(i, bschedcount))) : nlapiDateToString(nlapiAddDays(nlapiStringToDate(contract_start_date), -1)); 
				}
				else {
					renewal_date = nlapiDateToString(nlapiAddMonths(contract_end_date, getReduction(i, bschedcount))); 
				}	
				
				// Create a new business record
				var newbusrec = nlapiCreateRecord('customrecord_newbus');
				newbusrec.setFieldValue('custrecord_newbus_date',bscheddate);
				newbusrec.setFieldValue('custrecord_newbus_txn',esid);
				newbusrec.setFieldValue('custrecord_newbus_renewal_amount', renamtvar);
				newbusrec.setFieldValue('custrecord_newbus_amount',(bschedamount-renamtvar));
				newbusrec.setFieldValue('custrecord_newbus_renewal_date', renewal_date);
				nlapiSubmitRecord(newbusrec);
				//if (i != bschedcount)
				//renbustot += bschedamount;
				renamtvar = bschedamount;
				nlapiLogExecution('debug','newbustot '+bschedamount+'renbustot '+bschedamount+'renamtvar '+renamtvar+'renbustot '+renbustot);
				
			}
		}
		else if (isEmpty(billsched) && newterm > 12 && isNotEmpty(cotermcontracts)){
			newbustot = (newtot-newcotermtot-fromcontractamt+(newcotermannualvalue-oldcotermannualtot));
			if (newbustot < 0)
				newbustot = 0;
		}
		
		//Everything else
		else{
			// Calc new business
			if (ratediff <= 0)
				ratediff = 0;
			// Removed By MB on 01/08/2015 To allow for proper calc of new business with a public billing schedule
			//if (newterm > 12)
				//newterm = 12;
			
			newbustot = roundNumber((ratediff*newterm)+cotermdiff,2);
			nlapiLogExecution('debug','newbustot '+newbustot+' ratediff '+ratediff+'disctot '+disctot);
			if (newbustot<0)
				newbustot=0;
			// Calc renewal business
			if(oldcotermtot == 0 && fromcontractamt == 0 ){
				newbustot = newtot;
			}
		}
		renbustot = newtot-newbustot;
		
		nlapiSubmitField('estimate',esid,'custbody_ta_trans_new_business',newbustot);
		nlapiSubmitField('estimate',esid,'custbody_ta_total_renewal_amount',renbustot);

		/*
		** updates opportunity automatically after saving
		*/
		if(isNotEmpty(opid)){
			var lowest_val_esid = getLowestQuote(opid);
			if(esid == lowest_val_esid){
				
				var esflds=[];
				var esvals=[];
				esflds.push('total','custbody_cotermcontracttotal','custbody_ta_total_renewal_amount','custbody_ta_trans_new_business');
				esvals = nlapiLookupField('estimate',esid,esflds);
				// Lowest Priced Quote gets included in forecasting
				nlapiSubmitField('estimate', esid, 'includeinforecast', 'T');
				nlapiSubmitField('opportunity',opid,'custbody_ta_updated_from_quote',esid);
				nlapiSubmitField('opportunity',opid,'projectedtotal',esvals['total']);
				nlapiSubmitField('opportunity',opid,'custbody_cotermcontracttotal',esvals['custbody_cotermcontracttotal']);
				nlapiSubmitField('opportunity',opid,'custbody_ta_total_renewal_amount',esvals['custbody_ta_total_renewal_amount']);
				nlapiSubmitField('opportunity',opid,'custbody_ta_trans_new_business',esvals['custbody_ta_trans_new_business']);
				nlapiSubmitField('opportunity',opid,'custbody_ta_trans_new_business',esvals['custbody_ta_trans_new_business']);
				
				// Uncheck includeinforecast on all other quotes with same opp id 
				var other_quotes = getAllOtherQuotes(opid, esid);
				if(other_quotes){
					for(var q = 0; q < other_quotes.length; q += 1){
						nlapiSubmitField('estimate', other_quotes[q], 'includeinforecast', 'F');
					}
				}
				
			}
			else{
				nlapiSubmitField('estimate', esid, 'includeinforecast', 'F');
				var curr_updated_from_quote = nlapiLookupField('opportunity', opid, 'custbody_ta_updated_from_quote');
				
				// if the quote From Quote field on opportunity is this quote,
				// it means the quote was the lowest quote before it is edited.
				// So find the current lowest quote and write the information to opportunity 
				if(esid == curr_updated_from_quote){
					var low_es_flds = [];
					var low_es_vals = [];
					low_es_flds.push('total','custbody_cotermcontracttotal','custbody_ta_total_renewal_amount','custbody_ta_trans_new_business');
					low_es_vals = nlapiLookupField('estimate', lowest_val_esid, low_es_flds);
					nlapiSubmitField('opportunity',opid,'custbody_ta_updated_from_quote',lowest_val_esid);
					nlapiSubmitField('opportunity',opid,'projectedtotal',low_es_vals['total']);
					nlapiSubmitField('opportunity',opid,'custbody_cotermcontracttotal',low_es_vals['custbody_cotermcontracttotal']);
					nlapiSubmitField('opportunity',opid,'custbody_ta_total_renewal_amount',low_es_vals['custbody_ta_total_renewal_amount']);
					nlapiSubmitField('opportunity',opid,'custbody_ta_trans_new_business',low_es_vals['custbody_ta_trans_new_business']);
					nlapiSubmitField('opportunity',opid,'custbody_ta_trans_new_business',low_es_vals['custbody_ta_trans_new_business']);
				}
			}
		}
		
	}
	
}

function suitelet_multiyear_call_btn() {
	var esid = nlapiGetRecordId();
	var url = nlapiResolveURL('SUITELET', 'customscript_multi_year_assist_suitelet','customdeploycustomdeploy1');
	url += '&esid='+esid;
	window.open(url,'_self');
	
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

function copyBillschedToComment(esid, bschedcount){
	var esrec = nlapiLoadRecord('estimate', esid);
	var message = "\n"+"Billing Schedule :" + "\n";
	for (var i = 1; i <= bschedcount; i++){
		var billdate = esrec.getLineItemValue("billingschedule", "billdate", i);
		var billamount = esrec.getLineItemValue("billingschedule", "billamount", i);
		message += billdate + " -- \t\t"+" $" + billamount;
		message += "\n";
	}
	return message;
}

function getLowestQuote(opid) {
	var srchFilter = [];
	var srchColumn = [];
	var esids = [];
	var totals = [];
	srchFilter.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	srchFilter.push(new nlobjSearchFilter('opportunity', null, 'is', opid));
	srchColumn.push(new nlobjSearchColumn('total'));
	var results = nlapiSearchRecord('estimate', null, srchFilter, srchColumn);
	for(var i = 0; i < results.length; i++){
		totals.push(parseFloat(results[i].getValue('total')));
		esids.push(results[i].getId());
	}
	var min_total_index = totals.indexOf(Math.min.apply(Math, totals));
	return esids[min_total_index];
}

function getAllOtherQuotes(opid, esid) {
	var srchFilter = [];
	var esids = [];
	
	srchFilter.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	srchFilter.push(new nlobjSearchFilter('opportunity', null, 'is', opid));
	
	var results = nlapiSearchRecord('estimate', null, srchFilter);
	if(isNotEmpty(results)){
		for(var i = 0; i < results.length; i += 1){
			var result_id = results[i].getId();
			if(esid != result_id) esids.push(result_id);
		}
		
		if(esids){
			return esids;
		}else{
			return false;
		}
	}
}

