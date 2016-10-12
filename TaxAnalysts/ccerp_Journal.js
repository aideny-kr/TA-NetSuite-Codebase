/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       25 Oct 2014     Dana
 *
 */

function ccerp_create_kittomem_allocation(request, response){
	nlapiLogExecution('DEBUG', 'BEGIN GET ');

	if (request.getMethod() == 'GET') {
		nlapiLogExecution('DEBUG', 'BEGIN GET');
		
		// create list
		var form = nlapiCreateForm('Kit To Member Allocation');
		form.addSubmitButton('Submit');
		form.addResetButton();
		form.addButton('custpage_cancel_btn', 'Cancel','setWindowChanged(window, false);history.back();');
		var sublist = form.addSubList('sublist', 'list', 'Rev Rec Journal Entries');
		sublist.addMarkAllButtons();
		sublist.addField('apply', 'checkbox', 'Apply');
		sublist.addField('jeid', 'text', 'Rev Rec ID').setDisplayType('inline');
		sublist.addField('jenumber', 'text','Rev Rec Journal').setDisplayType('inline');
		sublist.addField('period', 'text', 'Period').setDisplayType('inline');
		
		// search for records
		var jefils = [];
		var jeresults = nlapiSearchRecord('transaction','customsearch_ccerpkitrevrec_suitelet', jefils);
		if (isNotEmpty(jeresults)) {
			for ( var i = 0; i < jeresults.length; i++) {
				sublist.setLineItemValue('jeid', i + 1, jeresults[i].getValue('internalid','applyingtransaction','group'));
				sublist.setLineItemValue('jenumber', i + 1, jeresults[i].getText('applyingtransaction',null,'group'));
				sublist.setLineItemValue('period', i + 1, jeresults[i].getText('postingperiod','applyingtransaction','group'));
			}
		}
		response.writePage(form);
	}

	// request.getMethod() == 'POST'
	else {
		nlapiLogExecution('DEBUG', 'BEGIN POST');

		
		var count = request.getLineItemCount('sublist');
		nlapiLogExecution('DEBUG', 'count ' + count);
		//var jeids = [];
		for ( var i = 1; i <= count; i++) {
			var apply = request.getLineItemValue('sublist', 'apply', i);
			if (apply == 'T'){
				var jeid = request.getLineItemValue('sublist', 'jeid', i);
				if(isNotEmpty(jeid)){
					var jerec = nlapiLoadRecord('journalentry',jeid);
					nlapiSubmitRecord(jerec);
				}
			}
		}
		var params = [];
		params['primarykey']='';
		params['date']='TODAY';
		params['scripttype']='149';
		nlapiSetRedirectURL('TASKLINK','LIST_SCRIPTSTATUS',412,null,params);
		return;
	}
}


function ccerp_journal_AfterSubmit(type){

	
	var context = nlapiGetContext();
	nlapiLogExecution('debug','context '+context);
	var execontext = context.getExecutionContext();
	nlapiLogExecution('debug','execontext '+execontext);
	
	if (type == 'edit' && (execontext == 'suitelet')){
		var jeid = nlapiGetRecordId();
		var isrevrec = nlapiLookupField('journalentry',jeid,'isrevrectransaction');
		var kittomemJE = nlapiGetFieldValue('custbody_ccerp_kittomember_jeid');
		if (isrevrec=='T' && isEmpty(kittomemJE)){
			var params = [];
			params['custscript_revrec_journalid'] = jeid;
			var status = nlapiScheduleScript('customscript_ccerp_kittomemberallo_sched',null, params);
			nlapiLogExecution('debug','status '+status);
			
		}
	}
}



function ccerp_KitToMemberAllocation_SCHED(){
	
	var context = nlapiGetContext();
	var jeid = context.getSetting('SCRIPT','custscript_revrec_journalid');
	nlapiLogExecution('debug','jeid '+jeid);
	//First search for Rev Rec Journal Entries
	
	
	var fils = [];
	fils.push(new nlobjSearchFilter('internalid','applyingtransaction','is',jeid));
	var jeresults = nlapiSearchRecord(null,'customsearch_ccerpkitrevrec',fils);
	if (isNotEmpty(jeresults)){
		var jerec = nlapiCreateRecord('journalentry');
		for (var i = 0; i < jeresults.length; i++) {
			nlapiLogExecution('debug','jeresults.length '+jeresults.length);
			var jeid = jeresults[i].getValue('internalid','applyingtransaction','group');
			var jedate = jeresults[i].getValue('trandate','applyingtransaction','group');
			var dbacct = jeresults[i].getValue('account', 'applyingtransaction','group');
			//var jelineid = jeresults[i].getValue('line', 'applyingtransaction','group');
			var dbamt = roundCurrency(MyParseFloat(jeresults[i].getValue('amount', 'applyingtransaction','sum')));
			//var inid = jeresults[i].getValue('internalid',null,'group');
			var item = jeresults[i].getValue('item',null,'group');
			nlapiLogExecution('debug','item '+item+'dbamt '+dbamt);
			jerec.setFieldValue('trandate',jedate);
			jerec.setFieldValue('custbody_is_kittomember_allocation','T');
			jerec.selectNewLineItem('line');
			jerec.setCurrentLineItemValue('line', 'account', dbacct);
			jerec.setCurrentLineItemValue('line', 'memo', 'Kit To Member Allocation');
			jerec.setCurrentLineItemValue('line', 'debit', dbamt);
			jerec.setCurrentLineItemValue('line', 'custcol_ccerp_revrec_jrnl', jeid);
			jerec.commitLineItem('line');
			
			//Get Member Items Allocation %
			var memfils=[(new nlobjSearchFilter('internalid',null,'is',item))];
			memresults = nlapiSearchRecord(null,'customsearch_ccerpkittomember_allocation',memfils);
			nlapiLogExecution('debug','memresults.length '+memresults.length);
			var allocationdelta = dbamt;
			if (isNotEmpty(memresults)){
				for (var m = 0; m < memresults.length; m++){
					var cracct = memresults[m].getValue('incomeaccount','memberitem');
					var allocationpct = MyParseFloat(memresults[m].getValue('formulapercent'))/100;
					var allocationamt = roundCurrency(allocationpct*dbamt);
					if(m == memresults.length-1 && allocationdelta != 0){
						allocationamt = roundCurrency(allocationdelta);
					}	
					nlapiLogExecution('debug', 'Memline '+m+'alloamt '+allocationamt+'allopct '+allocationpct+'allocationtot '+allocationamt);
					jerec.selectNewLineItem('line');
					jerec.setCurrentLineItemValue('line', 'account', cracct);
					jerec.setCurrentLineItemValue('line', 'credit', allocationamt);
					jerec.commitLineItem('line');
					allocationdelta -= allocationamt;
					nlapiLogExecution('debug','Allocstiondelta '+allocationdelta);
				}
				
			}
			// Check usageRemaining
			var usageRemaining = parseFloat(context.getRemainingUsage());
			nlapiLogExecution('debug','i '+i+' usageRemaining '+usageRemaining);
			context.setPercentComplete(roundNumber((100 * i) / jeresults.length,2));
			context.getPercentComplete();
			if ((usageRemaining <= 300 && (i + 1) < mainResults.length) || i == 999) {
				var status = nlapiScheduleScript(context.getScriptId(), null);
				if (status == 'QUEUED')
					break;
			}
		}
		var allocationjeid = nlapiSubmitRecord(jerec);
		nlapiSubmitField('journalentry',jeid,'custbody_ccerp_kittomember_jeid',allocationjeid);
	}
}
